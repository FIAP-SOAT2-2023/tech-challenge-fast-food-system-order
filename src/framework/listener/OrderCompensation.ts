import * as AWS from 'aws-sdk';
import {BasketUseCase} from "../../core/applications/usecases/basketUseCase";
import {DeleteMessageCommand, ReceiveMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import {IOrderUseCase} from "../../core/domain/usecases/IOrderUseCase";
import {OrderStatus} from "../../core/domain/entities/orderStatus";
import {IOrderStatusUseCase} from "../../core/domain/usecases/IOrderStatusUseCase";
import {Order} from "../../core/domain/entities/order";
import {IOrderRepository} from "../../core/domain/repositories/orderRepository";
import orderStatus from "../enum/orderStatus";

interface SQSMessage {
    Body?: string;
}

interface SQSReceiveMessageResponse {
    Messages?: AWS.SQS.Message[];
}

const listenSQSMessages = async (  orderUseCase: IOrderUseCase, orderStatus: IOrderStatusUseCase, orderRepository: IOrderRepository) => {

    const sqsClient = new SQSClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESSKEY,
            secretAccessKey: process.env.AWS_SECRETKEY,
        },
    });

    // Criar um objeto SQS
    //const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

    // Função para processar mensagens recebidas
    const processMessage = async (message: AWS.SQS.Message) => {
        try {
            const body = JSON.parse(message.Body!);
            console.log('Mensagem recebida:', body);
            const orderId = body.orderId;

            //basketUseCase.cancelBasket(orderId)

            const order = await orderRepository.findOrderByUUID(orderId)

            if (order) {

                order.status = await orderStatus.getByKey("REVERSED");

                await orderUseCase.updateOrderById(orderId, order);

                console.debug("success to cancel order: ", order);
            }

            /**/

        } catch (Error) {
            console.error('Erro ao processar mensagem:', Error);
        } finally {
            // Upon successful processing, delete the message from the queue
            await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: process.env.AWS_COMPESATION_ORDER_QUEE01,
                ReceiptHandle: message.ReceiptHandle,
            }));

            console.debug("Message deleted successfully");
        }
    };

    // Função para receber mensagens da fila
    const receiveMessages = async (sqsClient) => {
        try {
            const params = {
                QueueUrl: process.env.AWS_COMPESATION_ORDER_QUEE01,
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
            // Chamar a função novamente para continuar escutando a fila
            receiveMessages(sqsClient);
        }
    };

    // Iniciar a escuta da fila
    receiveMessages(sqsClient);
};

export default listenSQSMessages;
