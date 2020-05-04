import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  private transactionsRepository: TransactionsRepository;

  constructor(transactionsRepository: TransactionsRepository) {
    this.transactionsRepository = transactionsRepository;
  }

  public async execute({ id }: Request): Promise<void> {
    if (!(await this.transactionsRepository.count({ where: { id } }))) {
      throw new AppError('Transaction not found');
    }

    await this.transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
