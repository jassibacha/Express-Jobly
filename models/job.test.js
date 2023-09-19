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
            },
            {
                id: 2,
                title: 'J2',
                salary: 2000,
                equity: '0.0',
                companyHandle: 'c2',
            },
            {
                id: 3,
                title: 'J3',
                salary: 3000,
                equity: '0.0',
                companyHandle: 'c3',
            },
        ]);
    });
    // test('works: filter by name', async function () {
    //     let companies = await Company.findAll({ name: 'C1' });
    //     expect(companies).toEqual([
    //         {
    //             handle: 'c1',
    //             name: 'C1',
    //             description: 'Desc1',
    //             numEmployees: 1,
    //             logoUrl: 'http://c1.img',
    //         },
    //     ]);
    // });
    // test('works: filter by minEmployees', async function () {
    //     let companies = await Company.findAll({ minEmployees: 2 });
    //     expect(companies).toEqual([
    //         {
    //             handle: 'c2',
    //             name: 'C2',
    //             description: 'Desc2',
    //             numEmployees: 2,
    //             logoUrl: 'http://c2.img',
    //         },
    //         {
    //             handle: 'c3',
    //             name: 'C3',
    //             description: 'Desc3',
    //             numEmployees: 3,
    //             logoUrl: 'http://c3.img',
    //         },
    //     ]);
    // });
    // test('works: filter by maxEmployees', async function () {
    //     let companies = await Company.findAll({ maxEmployees: 2 });
    //     expect(companies).toEqual([
    //         {
    //             handle: 'c1',
    //             name: 'C1',
    //             description: 'Desc1',
    //             numEmployees: 1,
    //             logoUrl: 'http://c1.img',
    //         },
    //         {
    //             handle: 'c2',
    //             name: 'C2',
    //             description: 'Desc2',
    //             numEmployees: 2,
    //             logoUrl: 'http://c2.img',
    //         },
    //     ]);
    // });
    // test('works: filter by min & maxEmployees', async function () {
    //     let companies = await Company.findAll({
    //         minEmployees: 1,
    //         maxEmployees: 2,
    //     });
    //     expect(companies).toEqual([
    //         {
    //             handle: 'c1',
    //             name: 'C1',
    //             description: 'Desc1',
    //             numEmployees: 1,
    //             logoUrl: 'http://c1.img',
    //         },
    //         {
    //             handle: 'c2',
    //             name: 'C2',
    //             description: 'Desc2',
    //             numEmployees: 2,
    //             logoUrl: 'http://c2.img',
    //         },
    //     ]);
    // });
    // test('bad request error when min > max employees', async function () {
    //     try {
    //         await Company.findAll({
    //             minEmployees: 3,
    //             maxEmployees: 2,
    //         });
    //         fail();
    //     } catch (err) {
    //         expect(err instanceof BadRequestError).toBeTruthy();
    //     }
    // });
    // test('works: filtering by name and employee range', async function () {
    //     let companies = await Company.findAll({
    //         name: 'C',
    //         minEmployees: 1,
    //         maxEmployees: 2,
    //     });
    //     expect(companies).toEqual([
    //         {
    //             handle: 'c1',
    //             name: 'C1',
    //             description: 'Desc1',
    //             numEmployees: 1,
    //             logoUrl: 'http://c1.img',
    //         },
    //         {
    //             handle: 'c2',
    //             name: 'C2',
    //             description: 'Desc2',
    //             numEmployees: 2,
    //             logoUrl: 'http://c2.img',
    //         },
    //     ]);
    // });
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

    // test('works: null fields', async function () {
    //     const updateDataSetNulls = {
    //         name: 'New',
    //         description: 'New Description',
    //         numEmployees: null,
    //         logoUrl: null,
    //     };

    //     let company = await Company.update('c1', updateDataSetNulls);
    //     expect(company).toEqual({
    //         handle: 'c1',
    //         ...updateDataSetNulls,
    //     });

    //     const result = await db.query(
    //         `SELECT handle, name, description, num_employees, logo_url
    //        FROM companies
    //        WHERE handle = 'c1'`
    //     );
    //     expect(result.rows).toEqual([
    //         {
    //             handle: 'c1',
    //             name: 'New',
    //             description: 'New Description',
    //             num_employees: null,
    //             logo_url: null,
    //         },
    //     ]);
    // });

    // test('not found if no such company', async function () {
    //     try {
    //         await Company.update('nope', updateData);
    //         fail();
    //     } catch (err) {
    //         expect(err instanceof NotFoundError).toBeTruthy();
    //     }
    // });

    // test('bad request with no data', async function () {
    //     try {
    //         await Company.update('c1', {});
    //         fail();
    //     } catch (err) {
    //         expect(err instanceof BadRequestError).toBeTruthy();
    //     }
    // });
});

/************************************** remove */

// describe('remove', function () {
//     test('works', async function () {
//         await Company.remove('c1');
//         const res = await db.query(
//             "SELECT handle FROM companies WHERE handle='c1'"
//         );
//         expect(res.rows.length).toEqual(0);
//     });

//     test('not found if no such company', async function () {
//         try {
//             await Company.remove('nope');
//             fail();
//         } catch (err) {
//             expect(err instanceof NotFoundError).toBeTruthy();
//         }
//     });
// });
