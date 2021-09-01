import * as ec2 from '@aws-cdk/aws-ec2';
import { App, Construct, Stack, StackProps } from '@aws-cdk/core';

export interface guardDemoProps extends StackProps {
  isDefaultvpc?: boolean;
}

export class guardDemo extends Stack {
  constructor(scope: Construct, id: string, props: guardDemoProps) {
    super(scope, id, props);
    const vpc = props?.isDefaultvpc ? ec2.Vpc.fromLookup(this, 'defVpc', { isDefault: true }) : new ec2.Vpc(this, 'newVpc', { natGateways: 1, maxAzs: 3 });
    const sg = new ec2.SecurityGroup(this, 'checkSG', {
      securityGroupName: 'checkSG',
      allowAllOutbound: true,
      description: 'This is for cdk cloudformation-guard demo Security Group.',
      vpc,
    });
    const companyIp = '1.2.3.4/32';
    sg.addIngressRule(ec2.Peer.ipv4(companyIp), ec2.Port.allTraffic());
    sg.addIngressRule(ec2.Peer.ipv4(companyIp), ec2.Port.tcp(3306));
    sg.addIngressRule(ec2.Peer.ipv4(companyIp), ec2.Port.tcp(22));
  }
}

export interface guardDemoFailProps extends StackProps {
  isDefaultvpc?: boolean;
}
export class guardDemoFail extends Stack {
  constructor(scope: Construct, id: string, props: guardDemoFailProps) {
    super(scope, id, props);
    const vpc = props?.isDefaultvpc ? ec2.Vpc.fromLookup(this, 'defVpc', { isDefault: true }) : new ec2.Vpc(this, 'newVpc', { natGateways: 1, maxAzs: 3 });
    const sg = new ec2.SecurityGroup(this, 'checkSG', {
      securityGroupName: 'checkSG',
      allowAllOutbound: true,
      description: 'This is for cdk cloudformation-guard demo Security Group.',
      vpc,
    });
    const companyIp = '1.2.3.4/32';
    sg.addIngressRule(ec2.Peer.ipv4(companyIp), ec2.Port.allTraffic());
    sg.addIngressRule(ec2.Peer.ipv4(companyIp), ec2.Port.tcp(3306));
    sg.addIngressRule(ec2.Peer.ipv4(companyIp), ec2.Port.tcp(22));
    // where check pass, only 80 and 443 can from anyivp4.
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    // where check fail, only 80 and 443 can from anyivp4.
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    // where check fail, only 80 and 443 can from anyivp4.
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());
  }
}
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new guardDemo(app, 'cdk-cloudformation-guard-demo', { env: devEnv });
new guardDemoFail(app, 'cdk-cloudformation-guard-demo-fail', { env: devEnv });

app.synth();