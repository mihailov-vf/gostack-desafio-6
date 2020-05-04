import { Repository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

type TransactionType = 'income' | 'outcome';
type CategoriesRepository = Repository<Category>;

interface Request {
  title: string;
  type: string;
  value: number;
  categoryName: string;
}

class CreateTransactionService {
  private transactionsRepository: TransactionsRepository;

  private categoriesRepository: CategoriesRepository;

  constructor(
    transactionsRepository: TransactionsRepository,
    categoriesRepository: CategoriesRepository,
  ) {
    this.transactionsRepository = transactionsRepository;
    this.categoriesRepository = categoriesRepository;
  }

  public async execute({
    title,
    type,
    value,
    categoryName,
  }: Request): Promise<Transaction> {
    if (!value) {
      throw new AppError('A transaction should have a significative value');
    }

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid Transaction type');
    }

    const balance = await this.transactionsRepository.getBalance();
    if (type === 'outcome' && Math.abs(value) > balance.total) {
      throw new AppError('Cannot retrieve an amount greater than your funds');
    }

    const category =
      (await this.categoriesRepository.findOne({
        where: { title: categoryName },
      })) || this.categoriesRepository.create({ title: categoryName });

    const transaction = this.transactionsRepository.create({
      title,
      type: type as TransactionType,
      value,
      category,
    });

    return this.transactionsRepository.save(transaction);
  }
}

export default CreateTransactionService;
