const aws = require('aws-sdk');

exports.handler = async () => {
  // List of resources related to VPCs in AWS. Note: the actual AWS::EC2::VPC needs to be last in the array, as AWS won't let you delete VPCs with existing dependencies
  // See these fun docs for an explanation: https://aws.amazon.com/premiumsupport/knowledge-center/troubleshoot-dependency-error-delete-vpc/
  const resourcesToEradicate = ['AWS::EC2::EIP', 'AWS::EC2::InternetGateway', 'AWS::EC2::NetworkAcl', 'AWS::EC2::NetworkInterface', 'AWS::EC2::RouteTable', 'AWS::EC2::SecurityGroup', 'AWS::EC2::Subnet', 'AWS::EC2::VPC'] // replace this with whatever resources you want deleted

  try {
    for (let resource of resourcesToEradicate) {
      console.log(`Beginning eradication on ${resource}`);
      await findResources(resource);
    }
  } catch (error) {
    console.log(error);
  }

  return {};
};

async function findResources (resource) {
  const cs = new aws.ConfigService();

  const resourceParams = {
    ConfigurationAggregatorName: 'vpc-eradicator', /* required */
    ResourceType: resource
  };

  // Get array of resources for eradication from AWS Config
  const resources = await cs.listAggregateDiscoveredResources(resourceParams).promise();
  console.log(resources);

  if (resources.ResourceIdentifiers.length > 0) { // run eradicateResources function only if the resource was found
    let count = resources.ResourceIdentifiers.length === 1 ? 'VPC resource' : 'VPC resources'; // good grammar is important
    console.log(`Oh noes! ${resources.ResourceIdentifiers.length} ${count} discovered! Running eradicator.`);
    // Run eradicateResources function on each instance of that resource
    // await eradicateResources(resources);
  } else {
    console.log(`No ${resource} found here, your money is safe for now!`);
  }
}

async function eradicateResource(resource) {
  const ec2 = new aws.EC2();
  // We'll be using promises to make sure everything gets deleted
  let promiseArray = [];

  for (let resource of resources.ResourceIdentifiers) {
    let VpcId = resource.ResourceId;

    const params = {
      VpcId: VpcId
    };

    const p = ec2.deleteVpc(params)
    .promise()
    .then(() => {
      console.log (`VPC ${VpcId} in region ${resource.SourceRegion} eradicated! Use that cash for something else!`)
    })
    .catch((error) => {
      console.log(`Error deleting ${VpcId} in region ${resource.SourceRegion}.`);
      console.log(error.message);
    });

    promiseArray.push(p);
  };

  try {
    await Promise.all(promiseArray);
    console.log('Eradicating VPCs');
  } catch (error) {;
    console.log(error);
  }
}