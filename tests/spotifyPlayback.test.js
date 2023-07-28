const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const sequelize = require('../utils/db').sequelize;
const getClientAuthToken = require('./testUtils').getClientAuthToken;

let clientToken = '';

beforeAll(async () => {
  clientToken = await getClientAuthToken();
  clientToken = 'Bearer ' + clientToken;
});

describe('search tests', () => {
  test('use search route', async () => {
    console.log(clientToken);
  });
});

afterAll(async () => {
  try{
    await sequelize.close();
  }
  catch(error) {
    console.log(error);
  }

});