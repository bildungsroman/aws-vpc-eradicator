#!/usr/bin/env bash


if [ "$AWS_PROFILE" = "" ]; then
  echo "No AWS_PROFILE set"
  exit 1
fi


for region in $(aws ec2 describe-regions --region eu-west-1 | jq -r .Regions[].RegionName); do

  echo "* Region ${region}"

  # get default vpc
  vpc=$(aws ec2 --region ${region} \
    describe-vpcs --filter Name=isDefault,Values=true \
    | jq -r .Vpcs[0].VpcId)
  if [ "${vpc}" = "null" ]; then
    echo "No default vpc found"
    continue
  fi
  echo "Found default vpc ${vpc}"

  # get internet gateway
  igw=$(aws ec2 --region ${region} \
    describe-internet-gateways --filter Name=attachment.vpc-id,Values=${vpc} \
    | jq -r .InternetGateways[0].InternetGatewayId)
  if [ "${igw}" != "null" ]; then
    echo "Detaching and deleting internet gateway ${igw}"
    aws ec2 --region ${region} \
      detach-internet-gateway --internet-gateway-id ${igw} --vpc-id ${vpc}
    aws ec2 --region ${region} \
      delete-internet-gateway --internet-gateway-id ${igw}
  fi

  # get subnets
  subnets=$(aws ec2 --region ${region} \
    describe-subnets --filters Name=vpc-id,Values=${vpc} \
    | jq -r .Subnets[].SubnetId)
  if [ "${subnets}" != "null" ]; then
    for subnet in ${subnets}; do
      echo "Deleting subnet ${subnet}"
      aws ec2 --region ${region} \
        delete-subnet --subnet-id ${subnet}
    done
  fi

  # https://docs.aws.amazon.com/cli/latest/reference/ec2/delete-vpc.html
  # - You can't delete the main route table
  # - You can't delete the default network acl
  # - You can't delete the default security group

  # delete default vpc
  echo "Deleting vpc ${vpc}"
  aws ec2 --region ${region} \
    delete-vpc --vpc-id ${vpc}

done
