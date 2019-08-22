const aws = require('aws-sdk');

exports.handler = async () => {
  // Get valid VPC regions
  const ec2 = new aws.EC2();
  const ec2Regions = await ec2.describeRegions().promise();

  for (let region of ec2Regions.Regions) {
    await runEradicator(region.RegionName);
  }
  return {};
};

async function runEradicator (region) {
  // We need to find and eradicate VPCs in one region at a time
  const ec2region = new aws.EC2({region: region});

  let findVpcs = await ec2region.describeVpcs().promise();
  if (findVpcs.Vpcs.length > 0) { // run eradicateVpc function only if a VPC was found
    let count = findVpcs.Vpcs.length === 1 ? 'VPC' : 'VPCs'; // good grammar is important
    console.log(`Oh noes! ${findVpcs.Vpcs.length} ${count} discovered in region ${region}! Running eradicator.`);
    await eradicateVpc(findVpcs.Vpcs, region);
    //await eradicateResources(resources);
  } else {
    console.log(`No VPCs found in ${region}, your money is safe for now!`);
  }
};

async function eradicateVpc(vpcs, region) {
  const ec2region = new aws.EC2({region: region});

  for (let vpc of vpcs) {
    // First we need to find, detach and delete all resources related to each VPC in each region
    // See these fun docs for an explanation: https://aws.amazon.com/premiumsupport/knowledge-center/troubleshoot-dependency-error-delete-vpc/
    // This is also relevent: https://forums.aws.amazon.com/thread.jspa?threadID=92407
    // And this: https://stackoverflow.com/questions/34325336/i-cant-delete-my-vpc
    // Here's a Ruby example: https://gist.github.com/gregohardy/ef026eef3beddae49eb05ea0fe5993e0
    // And the Python example this was lately based on (thank you!): https://abhishekis.wordpress.com/2017/04/26/python-script-to-remove-the-default-vpc-of-all-the-regions-in-an-aws-account/
    const eni = await describeInterfaces(vpc.VpcId, ec2region);
    await detachInterfaces(eni.attachmentIds, ec2region)
    await deleteInterfaces(eni.eniIds, ec2region);
    const subnetIds = await describeSubnets(vpc.VpcId, ec2region);
    await deleteSubnets(subnetIds, ec2region);
    const igwIds = await describeIgws(vpc.VpcId, ec2region)
    await detachIgws(vpc.VpcId, igwIds, ec2region)
    await deleteIgws(igwIds, ec2region)
    // Now we can attempt to delete the VPC
    await deleteVpc(vpc.VpcId, ec2region, region)
  }
}

async function describeInterfaces(vpcId, ec2region) {
  let eniList = [];
  let attachmentList = [];
  const params = {
    DryRun: false,
    Filters: [
      {
        Name: 'vpc-id', 
        Values: [
          vpcId
        ]
      }
    ]
  };
  const response = await ec2region.describeNetworkInterfaces(params).promise();

  for (let eni of response.NetworkInterfaces) {
    eniList.push(eni.NetworkInterfaceId);
    attachmentList.push(eni.Attachment.AttachmentId);
  }

  return {
    attachmentIds: attachmentList,
    eniIds: eniList
  }
};

async function detachInterfaces(attachmentIds, ec2region) {
  for (let aId of attachmentIds) {
    try {
      await ec2region.detachNetworkInterface({
        DryRun: false,
        Force: true,
        AttachmentId: aId
      }).promise();
      console.log(`Detaching ENI ${eni}`)
    } catch (err) {
      console.log(err.message);
    }
  }
};

async function deleteInterfaces(eniIds, ec2region) {
  for (let eni of eniIds) {
    try {
      await ec2region.deleteNetworkInterface({
        DryRun: false,
        NetworkInterfaceId: eni
      }).promise()
      console.log(`Deleting ENI ${eni}`)
    } catch (err) {
      console.log(err.message);
    }
  }
};

async function describeSubnets(vpcId, ec2region) {
  let subnetList = [];
  const params = {
    DryRun: false,
    Filters: [
      {
        Name: 'vpc-id', 
        Values: [
          vpcId
        ]
      }
    ]
  };

  const response = await ec2region.describeSubnets(params).promise();

  for (let subnet of response.Subnets) {
    subnetList.push(subnet.SubnetId);
  }

  return subnetList;
};

async function deleteSubnets(subnetIds, ec2region) {
  for (let subnet of subnetIds) {
    try {
      await ec2region.deleteSubnet({
        DryRun: false,
        SubnetId: subnet
      }).promise()
      console.log(`Deleting subnet ${subnet}`)
    } catch (err) {
      console.log(err.message);
    }
  }
};

async function describeIgws(vpcId, ec2region) {
  let igwList = [];
  const params = {
    DryRun: false,
    Filters: [
      {
        Name: 'attachment.vpc-id', 
        Values: [
          vpcId
        ]
      }
    ]
  };

  const response = await ec2region.describeInternetGateways(params).promise();

  for (let igw of response.InternetGateways) {
    igwList.push(igw.InternetGatewayId);
  }

  return igwList;
};

async function detachIgws(vpcId, igwIds, ec2region) {
  for (let igwId of igwIds) {
    try {
      await ec2region.detachInternetGateway({
        DryRun: false,
        InternetGatewayId: igwId, 
        VpcId: vpcId
      }).promise();
      console.log(`Detaching IGW ${igwId}`)
    } catch (err) {
      console.log(err.message);
    }
  }
};

async function deleteIgws(igwIds, ec2region) {
  for (let igwId of igwIds) {
    try {
      await ec2region.deleteInternetGateway({
        DryRun: false,
        InternetGatewayId: igwId
      }).promise()
      console.log(`Deleting IGW ${igwId}`)
    } catch (err) {
      console.log(err.message);
    }
  }
};

async function deleteVpc(vpcId, ec2region, region) {
    try {
      await ec2region.deleteVpc({
        VpcId: vpcId,
        DryRun: false
      }).promise();
      console.log (`${vpcId} in region ${region} eradicated! Use that cash for something else!`)
    } catch (err) {
      console.log(`Error deleting ${vpcId} in region ${region}.`);
      console.log(err.message);
    }
}