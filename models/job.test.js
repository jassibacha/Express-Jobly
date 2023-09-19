'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function () {
    const newJob = {
        title: 'New Job',
        salary: 40000,
        equity: '0',
        companyHandle: 'c1',
    };

    test('create works', async function () {
        let job = await Job.create(newJob);
        expect(job).toMatchObject(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = ${job.id}`
        );
        expect(result.rows).toEqual([
            {
                id: job.id,
                title: job.title,
                salary: job.salary,
                equity: '0',
                companyHandle: job.companyHandle,
            },
        ]);
    });
});

/************************************** findAll */

describe('findAll', function () {
    test('works: no filter', async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
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
        ]);
    });
    test('works: filter by name', async function () {
        let jobs = await Job.findAll({ title: 'J1' });
        expect(jobs).toEqual([
            {
                id: 1,
                title: 'J1',
                salary: 1000,
                equity: '0.0',
                companyHandle: 'c1',
                companyName: 'C1',
            },
        ]);
    });
    test('works: filter by minSalary', async function () {
        let jobs = await Job.findAll({ minSalary: 1500 });
        expect(jobs).toEqual([
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
        ]);
    });
    test('works: filter by equity', async function () {
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
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
        ]);
    });
    test('works: filter by min salary & equity', async function () {
        let jobs = await Job.findAll({ minSalary: 1500, hasEquity: true });
        expect(jobs).toEqual([
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
        ]);
    });
});

/************************************** get */

describe('get', function () {
    test('works', async function () {
        let job = await Job.get(1);
        expect(job).toEqual({
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
        });
    });

    test('not found if no such job', async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe('update', function () {
    const updateData = {
        title: 'NewJ1',
        salary: 1001,
        equity: '0.0',
    };

    test('works', async function () {
        let job = await Job.update(1, updateData);
        expect(job).toEqual({
            id: 1,
            ...updateData,
            companyHandle: 'c1',
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = 1`
        );
        expect(result.rows).toEqual([
            {
                id: 1,
                title: 'NewJ1',
                salary: 1001,
                equity: '0.0',
                companyHandle: 'c1',
            },
        ]);
    });

    test('works: null fields', async function () {
        const updateDataSetNulls = {
            title: 'NewJ1',
            salary: null,
            equity: null,
        };

        let job = await Job.update(1, updateDataSetNulls);
        expect(job).toEqual({
            id: 1,
            ...updateDataSetNulls,
            companyHandle: 'c1',
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = 1`
        );
        expect(result.rows).toEqual([
            {
                id: 1,
                title: 'NewJ1',
                salary: null,
                equity: null,
                companyHandle: 'c1',
            },
        ]);
    });

    test('not found if no such job', async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test('bad request with no data', async function () {
        try {
            await Job.update(1, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe('remove', function () {
    test('works', async function () {
        await Job.remove(1);
        const res = await db.query('SELECT id FROM jobs WHERE id=1');
        expect(res.rows.length).toEqual(0);
    });

    test('not found if no such job', async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
