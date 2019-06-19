const aws = require('aws-sdk');

exports.handler = async () => {
  const ec2 = new aws.EC2();
  const cs = new aws.ConfigService();

  // We'll be using promises to make sure everything gets deleted
  let promiseArray = [];
  // be sure to add AWSConfigRole to function Policies
  const resourceParams = {
    ConfigurationAggregatorName: 'vpc-eradicator', /* required */
    ResourceType: 'AWS::DynamoDB::Table' // AWS::EC2::VPC
  };

  const countParams = {
    resourceTypes: ['AWS::EC2::VPC']
  };

  try {
    const resources = await cs.listAggregateDiscoveredResources(resourceParams).promise();
    const resourceCount = await cs.getDiscoveredResourceCounts(countParams).promise();

    if (resourceCount.totalDiscoveredResources > 0) { // if there is a VPC
      let VPC = resourceCount.totalDiscoveredResources === 1 ? 'VPC' : 'VPCs';

      console.log(`Panic! ${resourceCount.totalDiscoveredResources} ${VPC} discovered!`)
    } else {
      console.log('No VPCs found here, your money is safe!')
    }

    console.log(resources);

  } catch (error) {
    console.log(error);
  }


  // for (let region of regions) {
  //   const resourceParams = {
  //     'includeDeletedResources': false,
  //     'resourceType': 'AWS::EC2::VPC'
  //   }
  //   const config = cs.listDiscoveredResources(resourceParams)
  //     .promise()
  //     .then(() => {
  //       console.log (config)
  //     })
  //     .catch((error) => {
  //       console.log(error.message);
  //     });
  //   const VpcId = config.resourceIdentifiers.resourceId // get vpcid from response

  //   const params = {
  //     VpcId: VpcId
  //    };

  //   const p = ec2.deleteVpc(params)
  //     .promise()
  //     .then(() => {
  //       console.log (`VPC ${VpcId} in region ${region} eradicated! Use that cash for something else!`)
  //     })
  //     .catch((error) => {
  //       console.log(`Error deleting ${VpcId} in region ${region}.`);
  //       console.log(error.message);
  //     });
  //   promiseArray.push(p);
  // };

  // try {
  //   await Promise.all(promiseArray);
  //   console.log('Eradicating VPCs');
  // } catch (error) {;
  //   console.log(error);
  // }

  return {};
};
