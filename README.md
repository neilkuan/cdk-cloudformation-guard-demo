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
```

### k8s sample.
```bash
cd kubernetes

cfn-guard validate -r deployment.guard -d bad-deploy.yaml  -o yaml
--- example output ---
bad-deploy.yaml Status = FAIL
PASS rules
deployment.guard/version_and_kind_match                PASS
FAILED rules
deployment.guard/ensure_deploy_has_owner_label         FAIL
deployment.guard/ensure_container_has_memory_limits    FAIL
---
---
data_from: bad-deploy.yaml
rules_from: deployment.guard
not_compliant:
  ensure_container_has_memory_limits:
    - rule: ensure_container_has_memory_limits
      path: /spec/template/spec/containers/0
      provided: ~
      expected: ~
      comparison: ~
      message: "Attempting to retrieve array index or key from map at path = /spec/template/spec/containers/0 , Type was not an array/object map, Remaining Query = resources.limits"
  ensure_deploy_has_owner_label:
    - rule: ensure_deploy_has_owner_label
      path: /metadata/labels
      provided:
        app: nginx
      expected: ~
      comparison:
        operator: Exists
        not_operator_exists: false
      message: "\n            Id: Cathay_K8S_001\n            Description: Need Define Deployment Onwer\n        "
not_applicable: []
compliant:
  - version_and_kind_matchbad-deploy.yaml Status = FAIL
PASS rules
deployment.guard/version_and_kind_match                PASS
FAILED rules
deployment.guard/ensure_deploy_has_owner_label         FAIL
deployment.guard/ensure_container_has_memory_limits    FAIL
---
---
data_from: bad-deploy.yaml
rules_from: deployment.guard
not_compliant:
  ensure_container_has_memory_limits:
    - rule: ensure_container_has_memory_limits
      path: /spec/template/spec/containers/0
      provided: ~
      expected: ~
      comparison: ~
      message: "Attempting to retrieve array index or key from map at path = /spec/template/spec/containers/0 , Type was not an array/object map, Remaining Query = resources.limits"
  ensure_deploy_has_owner_label:
    - rule: ensure_deploy_has_owner_label
      path: /metadata/labels
      provided:
        app: nginx
      expected: ~
      comparison:
        operator: Exists
        not_operator_exists: false
      message: "\n            Id: Cathay_K8S_001\n            Description: Need Define Deployment Onwer\n        "
not_applicable: []
compliant:
  - version_and_kind_match
------
```
#### Let's take a look bad-deploy.yaml file.
- [ ]  **need define onwer label**
- [ ]  **need define container limits memory**
```bash
cat bad-deploy.yaml
----
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
------
```

```bash
cfn-guard validate -r deployment.guard -d good-deploy.yaml  -o yaml
--- example output ---
good-deploy.yaml Status = PASS
PASS rules
deployment.guard/version_and_kind_match                PASS
deployment.guard/ensure_deploy_has_owner_label         PASS
deployment.guard/ensure_container_has_memory_limits    PASS
---
Evaluation of rules deployment.guard against data good-deploy.yaml
--
Rule [deployment.guard/ensure_deploy_has_owner_label] is compliant for template [good-deploy.yaml]
Rule [deployment.guard/ensure_container_has_memory_limits] is compliant for template [good-deploy.yaml]
Rule [deployment.guard/version_and_kind_match] is compliant for template [good-deploy.yaml]
--
------
```




### terraform sample.

```bash
cd terraform/good_instance

terraform init

terraform plan -out tfgood.bin

terraform show -json tfgood.bin > tfgood.json

cd ../bad_instance

terraform init

terraform plan -out tfbad.bin

terraform show -json tfbad.bin > tfbad.json

cd ..
```

#### Let's check 
- bad instance
```bash
pwd 
xxx/xxx/cdk-cloudformation-guard-demo/terraform

cfn-guard validate -r terraform.guard -d bad_instance/tfbad.json -o yaml

--- example output ---
tfbad.json Status = FAIL
FAILED rules
terraform.guard/gcp_instance_need_lanuch_at_tw_az                  FAIL
terraform.guard/gcp_instance_network_cannot_use_default_network    FAIL
---
---
data_from: tfbad.json
rules_from: terraform.guard
not_compliant:
  gcp_instance_network_cannot_use_default_network:
    - rule: gcp_instance_network_cannot_use_default_network
      path: /planned_values/root_module/resources/0/values/network_interface/0/network
      provided: default
      expected: default
      comparison:
        operator: Eq
        not_operator_exists: true
      message: "\n                Id: Cathay_GCP_001\n                Description: GCE Need Lanuch at Taiwan Region\n             "
  gcp_instance_need_lanuch_at_tw_az:
    - rule: gcp_instance_need_lanuch_at_tw_az
      path: /planned_values/root_module/resources/0/values/zone
      provided: us-central1-a
      expected: asia-east1-a
      comparison:
        operator: In
        not_operator_exists: false
      message: "\n            Id: Cathay_GCP_001\n            Description: GCE Need Lanuch at Taiwan Region\n        "
    - rule: gcp_instance_need_lanuch_at_tw_az
      path: /planned_values/root_module/resources/0/values/zone
      provided: us-central1-a
      expected: asia-east1-b
      comparison:
        operator: In
        not_operator_exists: false
      message: "\n            Id: Cathay_GCP_001\n            Description: GCE Need Lanuch at Taiwan Region\n        "
    - rule: gcp_instance_need_lanuch_at_tw_az
      path: /planned_values/root_module/resources/0/values/zone
      provided: us-central1-a
      expected: asia-east1-c
      comparison:
        operator: In
        not_operator_exists: false
      message: "\n            Id: Cathay_GCP_001\n            Description: GCE Need Lanuch at Taiwan Region\n        "
not_applicable: []
compliant: []
------
```

- good instance
```bash
pwd 
xxx/xxx/cdk-cloudformation-guard-demo/terraform

cfn-guard validate -r terraform.guard -d good_instance/tfgood.json -o yaml
--- example output ---
tfgood.json Status = PASS
SKIP rules
terraform.guard/gcp_instance_network_cannot_use_default_network    SKIP
PASS rules
terraform.guard/gcp_instance_need_lanuch_at_tw_az                  PASS
---
---
data_from: tfgood.json
rules_from: terraform.guard
not_compliant: {}
not_applicable:
  - gcp_instance_network_cannot_use_default_network
compliant:
  - gcp_instance_need_lanuch_at_tw_az
-----------
```