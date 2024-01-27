import { Payment } from "../../../core/domain/entities/payment";
import { IPaymentRepository } from "../../../core/domain/repositories/paymentRepository";
import "dotenv/config";
export class PaymentRepository implements IPaymentRepository {
  createPayment(data: Payment): Promise<Payment> {
    const newPayment = { orderId: data.orderId, totalPrice: data.totalPrice };
    const apiUrl = process.env.URL_ORDERS;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPayment),
    };

    return new Promise<Payment>(async (resolve, reject) => {
      await fetch(apiUrl, requestOptions)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Erro na solicitação: ${response.statusText}`);
          }

          return response.json();
        })
        .then((data) => {
          console.log("Dados da resposta:", data);
          resolve(data);
        })
        .catch((error) => {
          console.error("Erro na solicitação:", error);
          reject(error);
        });
    });
  }
}
