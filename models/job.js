'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, companyHandle }
     * */

    static async create({ title, salary, equity, companyHandle }) {
        // const duplicateCheck = await db.query(
        //     `SELECT handle
        //    FROM companies
        //    WHERE handle = $1`,
        //     [handle]
        // );

        // if (duplicateCheck.rows[0])
        //     throw new BadRequestError(`Duplicate company: ${handle}`);

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs (optional filter on searchFilters).
     *
     * searchFilters (ALL optional):
     * - minSalary
     * - hasEquity (true returns only jobs with equity > 0, other values ignored)
     * - title (will find case-insensitive, partial matches)
     *
     * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
     * */

    static async findAll(searchFilters = {}) {
        //let query = `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`;
        let query = `SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS "companyHandle", c.name AS "companyName"
                    FROM jobs AS j
                    JOIN companies AS c ON c.handle = j.company_handle`;

        // Create empty array for sql conditions and empty array for values of the conditions
        let conditions = [];
        let values = [];

        // Pull these from callback
        const { title, minSalary, hasEquity } = searchFilters;

        // For each possible search term, add to conditions and values
        // Will be used to generate SQL
        if (minSalary !== undefined) {
            values.push(minSalary);
            conditions.push(`salary >= $${values.length}`);
        }

        if (hasEquity === true) {
            conditions.push(`equity > 0`);
        }

        if (title !== undefined) {
            values.push(`%${title}%`); // Need this wrapped in %
            conditions.push(`title ILIKE $${values.length}`);
        }

        // Add whatever conditions in under WHERE
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Finish the query
        query += ' ORDER BY title';

        // Pass in our completed query, and any values
        const jobsRes = await db.query(query, values);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, companyHandle, company }
     *   where company is { handle, name, description, numEmployees, logoUrl }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
            [id]
        );

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`Job (ID: ${id}) not found`);

        const companyRes = await db.query(
            `SELECT handle, 
                    name, 
                    description, 
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`,
            [job.companyHandle]
        );

        delete job.companyHandle;
        job.company = companyRes.rows[0];

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {
            //companyHandle: 'company_handle',
        });
        const idVarIdx = '$' + (values.length + 1);

        const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ID ${id}`);

        return job;
    }

    /** Delete given company from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ID ${id}`);
    }
}

module.exports = Job;
