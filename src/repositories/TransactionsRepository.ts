import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const qb = this.createQueryBuilder();

    const result = (
      await qb
        .select('Transaction.type', 'type')
        .addSelect('SUM(Transaction.value)', 'value')
        .groupBy('Transaction.type')
        .getRawMany()
    ).reduce(
      (results, sum) => {
        results[sum.type] = sum.value;

        return results;
      },
      { income: 0, outcome: 0 },
    );

    const balance = {
      income: result.income,
      outcome: result.outcome,
      total: result.income - result.outcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
