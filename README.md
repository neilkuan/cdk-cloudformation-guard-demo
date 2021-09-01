# Make your AWS CDK app more security via [cloudformation-guard](https://github.com/aws-cloudformation/cloudformation-guard/blob/d233ed4d3465197d931d4f62c05f4e77cbe50281/guard-examples/security-policies/ec2-secgroup-inbound-outbound-access-tests.yaml)

## To Install Cloudformation Guard
 - see [cloudformation-guard installation](https://github.com/aws-cloudformation/cloudformation-guard#installation)

## To Install package for aws cdk
```bash
git clone https://github.com/neilkuan/cdk-cloudformation-guard-demo

cd cdk-cloudformation-guard-demo

yarn

or 

npm i
--- example output ---
yarn install v1.22.10
[1/4] 🔍  Resolving packages...
success Already up-to-date...
...
...
```

## To Synth AWS CDK APP to Cloudformation
> Will create cloudformation `*.template.json` files in `cdk.out` directory. 
```bash
cdk synth
```

## List Stack of AWS CDK APP
```bash
cdk ls

--- example output ---
cdk-cloudformation-guard-demo
cdk-cloudformation-guard-demo-fail
```

## Let's take a look main.ts in src directory
The Pass Check Stack.
```ts
...
export class guardDemo extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'defVpc', {
      isDefault: true,
    });
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
```
The Fail Check Stack.
```ts
...
export class guardDemoFail extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'defVpc', {
      isDefault: true,
    });
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
    // will check pass, only 80 and 443 can from anyivp4.
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    // will check fail, only 80 and 443 can from anyivp4.
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    // will check fail, only 80 and 443 can from anyivp4.
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());
  }
}
```

## Let's take a look sg-rule-common-tcp.rules
```bash

## Find the resource that Type is 'AWS::EC2::SecurityGroup'.
let sg_resources = Resources.*[ Type == 'AWS::EC2::SecurityGroup' ]

## Define the rule, the ingress which all traffic from cidrip '0.0.0.0/0' can not be created. 
rule ingress_rule_not_in_anyipv4_to_any_traffic when %sg_resources !empty {
    let ingress = %sg_resources.Properties.SecurityGroupIngress[
        IpProtocol   is_string
    ]

    %ingress[*] {
        when this.CidrIp == "0.0.0.0/0" {
            this.IpProtocol != "-1"
        }
        
    }
}

## Define the rule, only the ingress which all traffic from cidrip '1.2.3.4/32'(ex: company ip) can be created. 
rule ingress_rule_allow_anyip_protocol_to_company_ip when %sg_resources !empty {
    let ingress = %sg_resources.Properties.SecurityGroupIngress[
        IpProtocol   is_string
    ]
    %ingress[*] {
        when this.CidrIp == "1.2.3.4/32" {
            this.IpProtocol IN ["tcp", "udp", "-1"]
        }
    }
}

## Define the rule, only the ingress which 443 or 80 from cidrip '0.0.0.0/0' can be created. 
rule ingress_rule_allow_http_https_can_from_anyip when %sg_resources !empty {
    let ingress = %sg_resources.Properties.SecurityGroupIngress[
        IpProtocol   is_string
    ]
    %ingress[*] {
        when this.CidrIp == "0.0.0.0/0" {
            this.FromPort IN [443, 80]
        }
    }
}
```

## Let's check the Cloudformation template
```bash
yarn guardcheck
or 
npm run guardcheck

--- example output ---
> npx projen guardcheck

🤖 guardcheck | env: PATH=/usr/local/lib/node_...
🤖 guardcheck | for i in `ls cdk.out/*template.json`;do cfn-guard validate  -r sg-rule-common-tcp.rules -o yaml --data $i;done
cdk-cloudformation-guard-demo-fail.template.json Status = FAIL
PASS rules
sg-rule-common-tcp.rules/ingress_rule_allow_anyip_protocol_to_company_ip    PASS
FAILED rules
sg-rule-common-tcp.rules/ingress_rule_not_in_anyipv4_to_any_traffic         FAIL
sg-rule-common-tcp.rules/ingress_rule_allow_http_https_can_from_anyip       FAIL
---
---
data_from: cdk-cloudformation-guard-demo-fail.template.json
rules_from: sg-rule-common-tcp.rules
not_compliant:
  ingress_rule_not_in_anyipv4_to_any_traffic:
    - rule: ingress_rule_not_in_anyipv4_to_any_traffic
      path: /Resources/checkSG2E84885A/Properties/SecurityGroupIngress/5/IpProtocol
      provided: "-1"
      expected: "-1"
      comparison:
        operator: Eq
        not_operator_exists: true
      message: ""
  ingress_rule_allow_http_https_can_from_anyip:
    - rule: ingress_rule_allow_http_https_can_from_anyip
      path: /Resources/checkSG2E84885A/Properties/SecurityGroupIngress/4/FromPort
      provided: 22
      expected: 443
      comparison:
        operator: In
        not_operator_exists: false
      message: ""
    - rule: ingress_rule_allow_http_https_can_from_anyip
      path: /Resources/checkSG2E84885A/Properties/SecurityGroupIngress/4/FromPort
      provided: 22
      expected: 80
      comparison:
        operator: In
        not_operator_exists: false
      message: ""
    - rule: ingress_rule_allow_http_https_can_from_anyip
      path: /Resources/checkSG2E84885A/Properties/SecurityGroupIngress/5
      provided: ~
      expected: ~
      comparison: ~
      message: "Attempting to retrieve array index or key from map at path = /Resources/checkSG2E84885A/Properties/SecurityGroupIngress/5 , Type was not an array/object map, Remaining Query = FromPort"
not_applicable: []
compliant:
  - ingress_rule_allow_anyip_protocol_to_company_ip

cdk-cloudformation-guard-demo.template.json Status = PASS
SKIP rules
sg-rule-common-tcp.rules/ingress_rule_not_in_anyipv4_to_any_traffic         SKIP
sg-rule-common-tcp.rules/ingress_rule_allow_http_https_can_from_anyip       SKIP
PASS rules
sg-rule-common-tcp.rules/ingress_rule_allow_anyip_protocol_to_company_ip    PASS
---
---
data_from: cdk-cloudformation-guard-demo.template.json
rules_from: sg-rule-common-tcp.rules
not_compliant: {}
not_applicable:
  - ingress_rule_not_in_anyipv4_to_any_traffic
  - ingress_rule_allow_http_https_can_from_anyip
compliant:
  - ingress_rule_allow_anyip_protocol_to_company_ip
```# cdk-cloudformation-guard-demo
