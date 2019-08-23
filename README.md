# VPC Eradicator! 💣

Tired of costly AWS bills because you forgot to delete a VPC once you were done with it? Hate going region by region in the AWS Console looking for every last resource? The VPC Eradicator 💣 is here to help!

### Benefits:
##### 💥 Keep at least a little of your money out of Jeff Bezos' pockets
##### 💥 Stop clogging your AWS account with dead resources
##### 💥 Your CTO will love you!

### Risks:
##### 💀 You'll save so much money, you'll be tempted to gamble it all when in Vegas for re:Invent, and will be savagely killed by the mob when you 10x your debts
##### 💀 If your beverage of choice is tequila, you may want want to skip the 'Grab a beverage' instruction now and then

_No rewards with out the risks, amiright?_

### Motivation:

The official [AWS way to delete a VPC and its dependencies](https://aws.amazon.com/premiumsupport/knowledge-center/troubleshoot-dependency-error-delete-vpc/) is to go into the AWS console and manually delete the VPC. In. Each. Region. So, if you have a default VPC in 16 or so regions that you want to delete, guess what you're doing for the next hour? 🤦

AWS [refuses to add](https://forums.aws.amazon.com/thread.jspa?threadID=223412) an [`--all-dependencies` option to `ec2 delete-vpc`](https://github.com/aws/aws-cli/issues/1721), so until they do (_ha!_), this may be the next best thing.

## 1. Setup

### Best way: Deploy with Stackery

Use the [Stackery CLI](https://docs.stackery.io/docs/using-stackery/cli/) to create and deploy your serverless stack. After all, I created this app in Stackery and it made all the AWS permissions wrangling a breeze!

1. In your terminal, enter:

```bash
stackery create -n vpc-eradicator -p github --github-org <your github username> --blueprint-git-url https://github.com/bildungsroman/aws-vpc-eradicator/
```
_(Developer's note: creating stacks based on existing git repos is a pro feature. If you're on the free developer plan, you can clone this stack the old fashioned way and use [local deploy](https://docs.stackery.io/docs/workflow/deploying-serverless-stacks/#local-checkout) to deploy it to your AWS account.)_

2. Once your stack is created, deploy it to your AWS account:

```bash
stackery deploy -n vpc-eradicator -e <your enviornment name> -r master --aws-profile <your AWS account profile>

# Example:
# stackery deploy -n vpc-eradicator -e dev -r master --aws-profile dev-account
```

3. Grab a beverage as your stack deploys to CloudFormation

### Acceptable way: Deploy with the AWS SAM CLI

1. Clone this repo
2. In the root of the repo, enter:

```bash
sam deploy --template-file template.yaml --stack-name vpc-eradicator --profile <your AWS account profile> --region <the AWS region to deploy to>

# Example:
# sam deploy --template-file template.yaml --stack-name vpc-eradicator --profile dev-account --region us-west-2
```

3. Grab a beverage as your stack deploys to CloudFormation

### Worst way: Add stack and deploy in the AWS Console

...just, don't.

## 2. Testing

Testing is easy with Stackery's `local invoke` command!

1. Clone your `vpc-eradicator` repo to your local machine
2. `cd` to the function directory of the repo (typically `cd vpc-eradicator/src/eradicateVPC`)
3. Run

   ```bash
   stackery local invoke --env-name <your deployed enviornment name> --aws-profile <the profile for the AWS account your stack is deployed to>

   # Example:
   # stackery local invoke --env-name dev --aws-profile dev-account
   ```
4. You should see something like this in the console if all goes well:

```bash
2019-08-23T18:21:16.869Z        52fdfc07-2182-154f-163f-5f0f9a621d72    INFO    No VPCs found in ca-central-1, your money is safe for now!
2019-08-23T18:21:17.968Z        52fdfc07-2182-154f-163f-5f0f9a621d72    INFO    No VPCs found in ap-southeast-1, your money is safe for now!
2019-08-23T18:21:18.936Z        52fdfc07-2182-154f-163f-5f0f9a621d72    INFO    No VPCs found in ap-southeast-2, your money is safe for now!
2019-08-23T18:21:19.738Z        52fdfc07-2182-154f-163f-5f0f9a621d72    INFO    No VPCs found in eu-central-1, your money is safe for now!
2019-08-23T18:21:20.152Z        52fdfc07-2182-154f-163f-5f0f9a621d72    INFO    Oh noes! 1 VPC discovered in region us-east-1! Running eradicator.
...
2019-08-23T18:21:37.539Z        52fdfc07-2182-154f-163f-5f0f9a621d72    INFO    'vpc-09dsf5654123eaa' in region 'us-east-1' eradicated! Use that cash for something else!
```
Sweet!

If for some strange reason you don't use [Stackery](https://www.stackery.io/), you can invoke your deployed function using the AWS CLI's `invoke` command:

```bash
aws lambda invoke --function-name vpc-eradicator-dev-eradicateVPC output.log
```

This won't show your local changes, so you'll have to re-deploy each time you make a change to the function (so save your liver and get the Stackery CLI for [local invoking](https://docs.stackery.io/docs/workflow/local-development/) already!).

Of course, there are many moving parts here, and any errors or failures to delete dependencies will likely prevent VPC deletion. At the moment, this is most foolproof against default VPCs. See the 'Known issues' section below, and consider contributing if you have any ideas for improvements!

### Contributing

Yes, please! This AWS VPC stuff is confusing, and anyone willing and able to make this app better is my 🦸!

The only rules are document your stuff, and [Wheaton's Law](https://www.attorneyatwork.com/wheatons-law/), of course.

### Known issues/FAQ

#### Cloudformation stacks

If you deployed a VPC as part of a Cloudformation stack, you'll likely run into errors such as:

```bash
You are not allowed to manage 'ela-attach' attachments.
```
and then

```bash
The vpc 'vpc-...' has dependencies and cannot be deleted.
```

Unfortunately, network interfaces that are deployed as part of a Cloudformation stack can only be deleted in the AWS Console 😞

The good news is, you can undeploy the stack and get rid of all your VPC resources in one go:

```bash
stackery undeploy -n <the offending stack name> -e <environment name>
```

#### Network vpc-xxxx has some mapped public addresses

See [this Stack Overflow thread](https://stackoverflow.com/questions/45027830/cant-delete-aws-internet-gateway) for clarification.

### How do you know the order of resource deletion?

I'm going by [this thread on the AWS forums](https://forums.aws.amazon.com/thread.jspa?threadID=92407), but it's from 2012 so who knows. Try moving things around if the function doesn't work for you.

#### Who built this awesomeness/monstrosity (delete as necessary)?

My name is Anna, and I'm a software engineer building fun serverless stuff over at [Stackery](https://www.stackery.io/) 👋