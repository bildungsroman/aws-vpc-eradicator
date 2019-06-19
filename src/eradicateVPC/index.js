const aws = require('aws-sdk');

exports.handler = async () => {
  const ec2 = new aws.EC2();
  const cs = new aws.ConfigService();

  // AWS regions for VPCs
  const regions = ['us-east-2', 'us-east-1', 'us-west-1', 'us-west-2', 'ap-south-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'sa-east-1'];
  // We'll be using promises to make sure everything gets deleted
  let promiseArray = [];
  // be sure to add AWSConfigRole to function Policies
  const configParams = {
    'includeDeletedResources': false,
    'resourceType': 'AWS::DynamoDB::Table' // AWS::EC2::VPC
  }

  try {
    const config = await cs.listDiscoveredResources(configParams).promise();
    const configCount = await cs.getDiscoveredResourceCounts().promise();
    console.log(config);
    console.log(configCount);
  } catch (error) {
    console.log(error);
  }


  // for (let region of regions) {
  //   const configParams = {
  //     'includeDeletedResources': false,
  //     'resourceType': 'AWS::EC2::VPC'
  //   }
  //   const config = cs.listDiscoveredResources(configParams)
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
