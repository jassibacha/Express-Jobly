'use strict';

const db = require('../db.js');
const User = require('../models/user');
const Company = require('../models/company');
const { createToken } = require('../helpers/tokens');
const Job = require('../models/job.js');

async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query('DELETE FROM users');
    // noinspection SqlWithoutWhere
    await db.query('DELETE FROM companies');

    await Company.create({
        handle: 'c1',
        name: 'C1',
        numEmployees: 1,
        description: 'Desc1',
        logoUrl: 'http://c1.img',
    });
    await Company.create({
        handle: 'c2',
        name: 'C2',
        numEmployees: 2,
        description: 'Desc2',
        logoUrl: 'http://c2.img',
    });
    await Company.create({
        handle: 'c3',
        name: 'C3',
        numEmployees: 3,
        description: 'Desc3',
        logoUrl: 'http://c3.img',
    });
    await Company.create({
        handle: 'c4',
        name: 'C4',
        numEmployees: 4,
        description: 'Desc4',
        logoUrl: 'http://c4.img',
    });

    await User.register({
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        password: 'password1',
        isAdmin: false,
    });
    await User.register({
        username: 'u2',
        firstName: 'U2F',
        lastName: 'U2L',
        email: 'user2@user.com',
        password: 'password2',
        isAdmin: false,
    });
    await User.register({
        username: 'u3',
        firstName: 'U3F',
        lastName: 'U3L',
        email: 'user3@user.com',
        password: 'password3',
        isAdmin: false,
    });
    await User.register({
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@user.com',
        password: 'adminpassword',
        isAdmin: true,
    });
    // Insert jobs and specify specific ID's as a query
    await db.query(`
    INSERT INTO jobs(id, title, salary, equity, company_handle)
    VALUES (1, 'J1', 1000, '0.0', 'c1'),
           (2, 'J2', 2000, '0.2', 'c2'),
           (3, 'J3', 3000, '0.3', 'c3')`);
    // Throw some applications in to test get correctly
    await db.query(`
    INSERT INTO applications(username, job_id)
    VALUES ('u2', 2), ('u2', 3)`);
}

async function commonBeforeEach() {
    await db.query('BEGIN');
}

async function commonAfterEach() {
    await db.query('ROLLBACK');
}

async function commonAfterAll() {
    await db.end();
}

const u1Token = createToken({ username: 'u1', isAdmin: false });

const adminToken = createToken({ username: 'admin', isAdmin: true });

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
};
