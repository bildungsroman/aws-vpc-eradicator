const aws = require('aws-sdk');

exports.handler = async () => {
  const cs = new aws.ConfigService();

  const resourceParams = {
    ConfigurationAggregatorName: 'vpc-eradicator', /* required */
    ResourceType: 'AWS::EC2::VPC' // replace this with whatever resource you want deleted
  };

  try {
    // Get array of resources for eradication from AWS Config
    const resources = await cs.listAggregateDiscoveredResources(resourceParams).promise();

    if (resources.ResourceIdentifiers.length > 0) { // run eradicateResources function only if there is a VPC
      let VPC = resources.ResourceIdentifiers.length === 1 ? 'VPC' : 'VPCs'; // good grammar is important
      console.log(`Oh noes! ${resources.ResourceIdentifiers.length} ${VPC} discovered!`);

      await eradicateResources(resources);
    } else {
      console.log('No VPCs found here, your money is safe!');
    }

  } catch (error) {
    console.log(error);
  }

  return {};
};

async function eradicateResources(resources) {
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