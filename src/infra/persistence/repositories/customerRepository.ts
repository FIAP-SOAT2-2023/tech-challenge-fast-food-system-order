//const axios = require("axios");
import { ICustomerRepository } from "../../../core/domain/repositories/customerRepository";
import { Customer } from "../../../core/domain/entities/customer";

export class CustomerRepository implements ICustomerRepository {
  getCustomerIdByDocument(document: string): Promise<Customer> {
    return new Promise<Customer>(async (resolve, reject) => {
      fetch(`http://localhost:4200/customer?document=${document}`)
        .then(function (response) {
          resolve(response.json());
        })
        .catch((err) => reject(err));
    });
  }
}
