import * as AWS from 'aws-sdk';
import {DeleteMessageCommand, ReceiveMessageCommand, SQSClient} from "@aws-sdk/client-sqs";

import {IOrderUseCase} from "../../core/domain/usecases/IOrderUseCase";
import {IOrderStatusUseCase} from "../../core/domain/usecases/IOrderStatusUseCase";
import {IOrderRepository} from "../../core/domain/repositories/orderRepository";


const listenSQSMessages = async (
    orderUseCase: IOrderUseCase,
    orderStatus: IOrderStatusUseCase,
    orderRepository: IOrderRepository
) => {
    const sqsClient = new SQSClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESSKEY,
            secretAccessKey: process.env.AWS_SECRETKEY,
        },
    });

    const processMessage = async (message: AWS.SQS.Message) => {
        try {
            const body = JSON.parse(message.Body!);
            console.log('Mensagem de preparação recebida:', body);
            const paymentId = body.order?.payment || body.paymentId

            const order = await orderRepository.findOrderByUUID(paymentId);

            if (order) {
                order.status = await orderStatus.getByKey("RECEIVED");
                await orderUseCase.updateOrderByPaymentId(paymentId, order);

                console.debug("success to received order: ", order);
            }

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        } finally {
            await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: process.env.AWS_PREPARATION_QUEE01,
                ReceiptHandle: message.ReceiptHandle,
            }));
            console.debug("Message deleted successfully");
        }
    };

    const receiveMessages = async (sqsClient) => {
        try {
            const params = {
                QueueUrl: process.env.AWS_PREPARATION_QUEE01,
                MaxNumberOfMessages: 10,
                VisibilityTimeout: 30,
                WaitTimeSeconds: 20,
            };

            const receiveMessageCommand = new ReceiveMessageCommand(params);
            const readMessage = await sqsClient.send(receiveMessageCommand);

            if (readMessage.Messages && readMessage.Messages.length > 0) {
                readMessage.Messages.forEach(processMessage);
            }
        } catch (error) {
            console.error('Erro ao receber mensagens:', error);
        } finally {
            receiveMessages(sqsClient);
        }
    };

    receiveMessages(sqsClient);
};

export default listenSQSMessages;
