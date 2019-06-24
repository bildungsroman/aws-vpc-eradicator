const aws = require('aws-sdk');

exports.handler = async () => {
  // List of resources related to VPCs in AWS. Note: the actual AWS::EC2::VPC needs to be last in the array, as AWS won't let you delete VPCs with existing dependencies - hence the for loop
  // See these fun docs for an explanation: https://aws.amazon.com/premiumsupport/knowledge-center/troubleshoot-dependency-error-delete-vpc/
  const resourcesToEradicate = ['AWS::EC2::Subnet', 'AWS::EC2::NetworkAcl', 'AWS::EC2::NetworkInterface', 'AWS::EC2::RouteTable', 'AWS::EC2::SecurityGroup', 'AWS::EC2::InternetGateway', 'AWS::EC2::VPC'] // replace this with whatever resources you want deleted

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
    await eradicateResources(resources);
  } else {
    console.log(`No ${resource} found here, your money is safe for now!`);
  }
}

async function eradicateResources(resources) {
  const ec2 = new aws.EC2();
  // We'll be using promises to make sure everything gets eradicated
  let promiseArray = [];

  for (let resource of resources.ResourceIdentifiers) {
    let resourceId = resource.ResourceId;
    let ec2action, params;

    // Set params and ec2 action based on resource type
    switch (resource.ResourceType) {
      case 'AWS::EC2::InternetGateway':
        params = {
          InternetGatewayId: resourceId
        };
        ec2action = ec2.deleteInternetGateway(params);
        break;
      case 'AWS::EC2::NetworkAcl':
        params = {
          NetworkAclId: resourceId
        };
        ec2action = ec2.deleteNetworkAcl(params);
        break;
      case 'AWS::EC2::NetworkInterface':
        params = {
          NetworkInterfaceId: resourceId
        };
        ec2action = ec2.deleteNetworkInterface(params);
        break;
      case 'AWS::EC2::RouteTable':
        params = {
          RouteTableId: resourceId
        };
        ec2action = ec2.deleteRouteTable(params);
        break;
      case 'AWS::EC2::SecurityGroup':
        params = {
          GroupId: resourceId
        };
        ec2action = ec2.deleteSecurityGroup(params);
        break;
      case 'AWS::EC2::Subnet':
        params = {
          SubnetId: resourceId
        };
        ec2action = ec2.deleteSubnet(params);
        break;
      case 'AWS::EC2::VPC':
        params = {
          VpcId: resourceId
        };
        ec2action = ec2.deleteVpc(params);
        break;
    }

    const p = ec2action
    .promise()
    .then(() => {
      console.log (`${resourceId} in region ${resource.SourceRegion} eradicated! Use that cash for something else!`)
    })
    .catch((error) => {
      console.log(`Error deleting ${resourceId} in region ${resource.SourceRegion}.`);
      console.log(error.message);
    });

    promiseArray.push(p);
  };

  try {
    await Promise.all(promiseArray);
    console.log('Eradicating all!');
  } catch (error) {;
    console.log(error);
  }
}