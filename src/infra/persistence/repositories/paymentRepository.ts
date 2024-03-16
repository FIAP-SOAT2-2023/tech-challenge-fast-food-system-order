import {Payment} from "../../../core/domain/entities/payment";
import {IPaymentRepository} from "../../../core/domain/repositories/paymentRepository";
import "dotenv/config";
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import {Basket} from "../../../core/domain/entities/basket";

export class PaymentRepository implements IPaymentRepository{
    async createPayment(basketResult: Basket, customer: String): Promise<void> {


        const sqsClient = new SQSClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESSKEY,
                secretAccessKey: process.env.AWS_SECRETKEY,
            },
        });

        const messageJSON = JSON.stringify({
          basket: basketResult, customer: customer

        });

        console.debug("Mensagem a ser enviada: ", messageJSON)

        try {

            const params = {
                QueueUrl: process.env.AWS_PAYMENT_QUEE01,
                MessageBody: messageJSON,
                MessageGroupId: process.env.AWS_GRUPO01,
            };
            const command = new SendMessageCommand(params);
            const response = await sqsClient.send(command);

            console.log(
                "As Mensagem foram enviada com sucesso. ID da mensagem:",
                response.MessageId
            );

        } catch (error) {
            console.error("Erro ao enviar mensagens para fila:", error);

            const params = {
                QueueUrl: process.env.AWS_COMPESATION_ORDER_QUEE01,
                MessageBody: `Houve erro no pagamento, segue número do Pedido: ${basketResult.order.code}\nFavor desfazer a reserva de itens para este pedido
         `,
                MessageGroupId: process.env.AWS_GRUPO01,
            };
            const command = new SendMessageCommand(params);
            const response = await sqsClient.send(command);

            console.log(
                "As Mensagem foram enviada com sucesso. ID da mensagem:",
                response.MessageId
            );
        }


    }
}
