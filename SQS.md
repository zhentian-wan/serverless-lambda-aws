## SQS

Define a queue:

serverless.yml

```yml
resources:
  Resources:
    ...
    deliveryServiceQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: deliveryServiceQueue
```

### Premission

```yml
- Effect: Allow
  Action:
    - sqs:SendMessage
  Resource:
    - arn:aws:sqs:#{AWS::Region}:#{AWS::AccountId}:deliveryServiceQueue
```

### Trigger a lambda

```yml
notifyDeliveryCompany:
  handler: handler.notifyDeliveryCompany
  events:
    - sqs:
        arn:
          Fn::GetAtt:
            - deliveryServiceQueue
            - Arn
        betchSize: 1
```
