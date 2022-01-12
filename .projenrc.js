const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.120.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-cloudformation-guard-demo',
  repository: 'https://github.com/neilkuan/cdk-cloudformation-guard-demo.git',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
  ],
  scripts: {
    guardcheck: 'for i in `ls cdk.out/*template.json`;do cfn-guard validate  -r sg-rule-common-tcp.rules -o yaml --data $i;done',
  },
  gitignore: [
    'cdk.context.json',
    '.terraform*',
    '*bin',
    'tf*.json',
  ],
  autoDetectBin: false,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['neilkuan'],
  },
});
project.synth();