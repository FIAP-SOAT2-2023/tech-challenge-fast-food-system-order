import { ICustomerRepository } from "../../../core/domain/repositories/customerRepository";
import { Customer } from "../../../core/domain/entities/customer";
import "dotenv/config";
export class CustomerRepository implements ICustomerRepository {
  getCustomerIdByDocument(document: string): Promise<Customer> {
    return new Promise<Customer>(async (resolve, reject) => {
      fetch(`${process.env.URL_CUSTOMER}${document}`)
        .then(function (response) {
          resolve(response.json());
        })
        .catch((err) => reject(err));
    });
  }
}
