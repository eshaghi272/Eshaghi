// import express from 'express';
// import {
//   getAllRecords,
//   getRecord,
//   insertRecord,
//   updateRecord,
//   deleteRecord
// } from '../controllers/generic.controller.js';

// const router = express.Router();

// // مسیرهای عمومی برای جدول tblStockTransaction
// router.get('/', (req, res) => getAllRecords({ ...req, query: { ...req.query, table: 'tblStockTransaction' } }, res));
// router.get('/:id', (req, res) => getRecord({ ...req, query: { table: 'tblStockTransaction', id: req.params.id } }, res));
// router.post('/', (req, res) => insertRecord({ ...req, body: { ...req.body, table: 'tblStockTransaction' } }, res));
// router.put('/:id', (req, res) => updateRecord({ ...req, body: { ...req.body, table: 'tblStockTransaction', id: req.params.id } }, res));
// router.delete('/:id', (req, res) => deleteRecord({ ...req, body: { table: 'tblStockTransaction', id: req.params.id } }, res));

// export default router;
