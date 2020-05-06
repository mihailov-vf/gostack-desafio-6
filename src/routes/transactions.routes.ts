import { Router } from 'express';
import { getCustomRepository, getRepository } from 'typeorm';
import multer from 'multer';

import uploadConfig from '../config/upload';

import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  return response.json(await transactionsRepository.getStatement());
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;
  const createTransaction = new CreateTransactionService(
    getCustomRepository(TransactionsRepository),
    getRepository('categories'),
  );

  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    categoryName: category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService(
    getCustomRepository(TransactionsRepository),
  );

  await deleteTransaction.execute({ id });
  return response.send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const filepath = request.file.path;

    const importTransaction = new ImportTransactionsService(
      getCustomRepository(TransactionsRepository),
      getRepository('Category'),
    );
    const transactions = await importTransaction.execute(filepath);

    return response.json(transactions);
  },
);

export default transactionsRouter;
