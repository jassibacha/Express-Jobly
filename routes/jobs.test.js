'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function () {
    const newJob = {
        title: 'Test',
        salary: 100,
        equity: '0.1',
        companyHandle: 'c1',
    };

    test('ok for admin', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                ...newJob,
                id: expect.any(Number),
            },
        });
    });

    test('fail for users', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('bad request with missing data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                title: 'Test',
                salary: 100,
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test('bad request with invalid data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                ...newJob,
                salary: 'red',
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe('GET /jobs', function () {
    test('ok for anon', async function () {
        const resp = await request(app).get('/jobs');
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: 1,
                    title: 'J1',
                    salary: 1000,
                    equity: '0.0',
                    companyHandle: 'c1',
                    companyName: 'C1',
                },
                {
                    id: 2,
                    title: 'J2',
                    salary: 2000,
                    equity: '0.2',
                    companyHandle: 'c2',
                    companyName: 'C2',
                },
                {
                    id: 3,
                    title: 'J3',
                    salary: 3000,
                    equity: '0.3',
                    companyHandle: 'c3',
                    companyName: 'C3',
                },
            ],
        });
    });

    test('fails: test next() handler', async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query('DROP TABLE jobs CASCADE');
        const resp = await request(app)
            .get('/jobs')
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });

    test('works: GET /jobs with title filter', async function () {
        const resp = await request(app).get('/jobs?title=J1');
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: 1,
                    title: 'J1',
                    salary: 1000,
                    equity: '0.0',
                    companyHandle: 'c1',
                    companyName: 'C1',
                },
            ],
        });
    });

    test('works: GET /jobs with minSalary filter', async function () {
        const resp = await request(app).get('/jobs?minSalary=1500');
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: 2,
                    title: 'J2',
                    salary: 2000,
                    equity: '0.2',
                    companyHandle: 'c2',
                    companyName: 'C2',
                },
                {
                    id: 3,
                    title: 'J3',
                    salary: 3000,
                    equity: '0.3',
                    companyHandle: 'c3',
                    companyName: 'C3',
                },
            ],
        });
    });

    test('works: GET /jobs with hasEquity filter', async function () {
        const resp = await request(app).get('/jobs?hasEquity=true');
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: 2,
                    title: 'J2',
                    salary: 2000,
                    equity: '0.2',
                    companyHandle: 'c2',
                    companyName: 'C2',
                },
                {
                    id: 3,
                    title: 'J3',
                    salary: 3000,
                    equity: '0.3',
                    companyHandle: 'c3',
                    companyName: 'C3',
                },
            ],
        });
    });

    test('works: GET /jobs with title, minSalary and equity filter', async function () {
        const resp = await request(app).get(
            '/jobs?title=J&minSalary=1500&hasEquity=true'
        );
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: 2,
                    title: 'J2',
                    salary: 2000,
                    equity: '0.2',
                    companyHandle: 'c2',
                    companyName: 'C2',
                },
                {
                    id: 3,
                    title: 'J3',
                    salary: 3000,
                    equity: '0.3',
                    companyHandle: 'c3',
                    companyName: 'C3',
                },
            ],
        });
    });
});

/************************************** GET /jobs/:id */

describe('GET /jobs/:handle', function () {
    test('works for anon', async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: 'J1',
                salary: 1000,
                equity: '0.0',
                company: {
                    handle: 'c1',
                    name: 'C1',
                    description: 'Desc1',
                    numEmployees: 1,
                    logoUrl: 'http://c1.img',
                },
            },
        });
    });

    test('not found for no such jobs', async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe('PATCH /jobs/:handle', function () {
    test('works for admin', async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: 'NewJ1',
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: 'NewJ1',
                salary: 1000,
                equity: '0.0',
                companyHandle: 'c1',
            },
        });
    });

    test('unauth for anon', async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: 'NewJ1',
            })
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('unauth for user', async function () {
        const resp = await request(app).patch(`/jobs/1`).send({
            title: 'NewJ1',
        });
        expect(resp.statusCode).toEqual(401);
    });

    test('not found on no such job', async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: 'NewJ1',
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    // test('bad request on handle change attempt', async function () {
    //     const resp = await request(app)
    //         .patch(`/jobs/1`)
    //         .send({
    //             handle: 'J1-new',
    //         })
    //         .set('authorization', `Bearer ${adminToken}`);
    //     expect(resp.statusCode).toEqual(400);
    // });

    test('bad request on invalid data', async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: 23,
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe('DELETE /jobs/:handle', function () {
    test('works for admin', async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: '1' });
    });

    test('unauth for admin', async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('unauth for anon', async function () {
        const resp = await request(app).delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401);
    });

    test('not found for no such company', async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
