import { Router } from 'express';
import { getCustomRepository, getRepository } from 'typeorm';

import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

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

  deleteTransaction.execute({ id });
  return response.send();
});

transactionsRouter.post('/import', async (request, response) => {
  // TODO
});

export default transactionsRouter;
