import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';
import { Repository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';
import Category from '../models/Category';

type TransactionType = 'income' | 'outcome';
type CategoriesRepository = Repository<Category>;

interface Request {
  filename: string;
}

interface TransactionData {
  title: string;
  type: TransactionType;
  value: number;
  categoryName: string;
}

class ImportTransactionsService {
  private transactionsRepository: TransactionsRepository;

  private categoriesRepository: CategoriesRepository;

  constructor(
    transactionsRepository: TransactionsRepository,
    categoriesRepository: CategoriesRepository,
  ) {
    this.transactionsRepository = transactionsRepository;
    this.categoriesRepository = categoriesRepository;
  }

  async execute(filepath: string): Promise<Transaction[]> {
    if (path.extname(filepath) !== '.csv') {
      throw new AppError('Invalid file type');
    }

    const csvFile = fs.createReadStream(filepath).pipe(
      csvParse({
        from_line: 2,
      }),
    );

    const transactionsData: TransactionData[] = [];
    const categoriesNames = new Set<string>([]);

    csvFile.on('data', line => {
      const [title, type, value, categoryName] = line.map((cell: string) =>
        cell.trim(),
      );

      categoriesNames.add(categoryName);
      transactionsData.push({
        title,
        type: type as TransactionType,
        value,
        categoryName,
      });
    });

    await new Promise(resolve => csvFile.on('end', resolve));

    const categoriesFound = await this.categoriesRepository.find({
      where: {
        title: In(Array.from(categoriesNames)),
      },
    });

    const categories = Array.from(categoriesNames)
      .filter(categoryName => {
        return !categoriesFound.find(categoryFound => {
          return categoryFound.title === categoryName;
        });
      })
      .reduce((allCategories, categoryName) => {
        allCategories.push(
          this.categoriesRepository.create({ title: categoryName }),
        );
        return allCategories;
      }, categoriesFound);

    await this.categoriesRepository.save(categories);

    const transactions: Transaction[] = [];
    transactionsData.forEach(transactionData => {
      const category = categories.find(
        cat => cat.title === transactionData.categoryName,
      );
      const transaction = this.transactionsRepository.create({
        title: transactionData.title,
        type: transactionData.type,
        category,
        value: transactionData.value,
      });

      transactions.push(transaction);
    });

    await fs.promises.unlink(filepath);

    return this.transactionsRepository.save(transactions);
  }
}

export default ImportTransactionsService;
