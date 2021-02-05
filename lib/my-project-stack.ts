import * as cdk from '@aws-cdk/core';
import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import lambda = require('@aws-cdk/aws-lambda');
import sns = require('@aws-cdk/aws-sns');
import { SnsAction } from '@aws-cdk/aws-cloudwatch-actions';
import * as subcriptions from '@aws-cdk/aws-sns-subscriptions';
import * as actions from "@aws-cdk/aws-cloudwatch-actions";

export class MyProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const lambdaFn = new lambda.Function(this, 'LambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'lambda.handler',
    });
    const errors= lambdaFn.metricErrors();
    const invocations = lambdaFn.metricInvocations();
    const throttle = lambdaFn.metricThrottles();
    
    const allproblems = new cloudwatch.MathExpression({
      expression: "errors + throttles",
      usingMetrics: {
        errors: errors,
        throttles: throttle
      }
    })
    const problemPercentage = new cloudwatch.MathExpression({
      expression: "(problems / invocations) * 100",
      usingMetrics: {
        problems: allproblems,
        invocations: invocations
      },
      period: cdk.Duration.minutes(1),
    })
    const Topic = new sns.Topic(this, 'Topic');
    Topic.addSubscription(
      new subcriptions.EmailSubscription("muhammadatifaltaf387@gmail.com")
    );
    const alarm = new cloudwatch.Alarm(this, 'Alarm', {
      metric: problemPercentage,
      threshold: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 1,
    });
    alarm.addAlarmAction(new SnsAction(Topic))
    // The code that defines your stack goes here
  }
}
