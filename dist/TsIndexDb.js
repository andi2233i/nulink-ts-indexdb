"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TsIndexDb {
    constructor({ dbName, version, tables }) {
        this.dbName = ''; //The database name 
        this.version = 1; //The database version
        this.tableList = []; //Table List 
        this.db = null;
        this.queue = []; //Transaction queue, once instantiated, the database will automatically start up the next time the page is opened.
        this.dbName = dbName;
        this.version = version;
        this.tableList = tables;
    }
    static getInstance(dbOptions) {
        if (TsIndexDb._instance === null && dbOptions) {
            TsIndexDb._instance = new TsIndexDb(dbOptions);
        }
        return TsIndexDb._instance;
    }
    //=================relate select================================
    /**
     * @method Query all data from a table (returning an array of specific values)
     * @param {Object}
     *   @property {String} tableName table name
     */
    queryAll({ tableName }) {
        let res = [];
        return this.commitDb(tableName, (transaction) => transaction.openCursor(), 'readonly', (e, resolve) => {
            this.cursor_success(e, {
                condition: () => true,
                handler: ({ currentValue }) => res.push(currentValue),
                success: () => resolve(res)
            });
        });
    }
    /**
     * @method Query (returning an array of specific values)
     * @param {Object}
     *   @property {String} tableName table name
     *   @property {Function} condition Query criteria
     * */
    query({ tableName, condition }) {
        let res = [];
        return this.commitDb(tableName, (transaction) => transaction.openCursor(), 'readonly', (e, resolve) => {
            this.cursor_success(e, {
                condition,
                handler: ({ currentValue }) => res.push(currentValue),
                success: () => resolve(res)
            });
        });
    }
    /**
     * @method Query the number of items that satisfy the given key (returns the count of items)
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} key Key to query
     *   @property {Object} countCondition Query condition
     * */
    /** countCondition The key must be a field that has already been indexed.
     *  key ≥ x	            {key: 'gt' rangeValue: [x]}
        key > x	            {key: 'gt' rangeValue: [x, true]}
        key ≤ y	            {key: 'lt' rangeValue: [y]}
        key < y	            {key: 'lt' rangeValue: [y, true]}
        key ≥ x && ≤ y	    {key: 'between' rangeValue: [x, y]}
        key > x &&< y	    {key: 'between' rangeValue: [x, y, true, true]}
        key > x && ≤ y	    {key: 'between' rangeValue: [x, y, true, false]}
        key ≥ x &&< y	    {key: 'between' rangeValue: [x, y, false, true]}
        key = z	            {key: 'equal' rangeValue: [z]}
     */
    count({ tableName, key, countCondition }) {
        const mapCondition = {
            equal: IDBKeyRange.only,
            gt: IDBKeyRange.lowerBound,
            lt: IDBKeyRange.upperBound,
            between: IDBKeyRange.bound,
        };
        return this.commitDb(tableName, (transaction) => transaction.index(key).count(mapCondition[countCondition.type](...countCondition.rangeValue)), 'readonly', (e, resolve) => {
            resolve(e.target.result || null);
        });
    }
    /**
     * @method Query data based on specific table properties and return a specific value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} key Name of the field to search
     *   @property {Number|String} value Value of the field to search
     * */
    query_by_keyValue({ tableName, key, value }) {
        return this.commitDb(tableName, (transaction) => transaction.index(key).get(value), 'readonly', (e, resolve) => {
            resolve(e.target.result || null);
        });
    }
    /**
     * @method Query data by primary key value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} value Primary key value
     * */
    query_by_primaryKey({ tableName, value }) {
        return this.commitDb(tableName, (transaction) => transaction.get(value), 'readonly', (e, resolve) => {
            resolve(e.target.result || null);
        });
    }
    //=================relate update================================
    /**
     * @method Modify data and return the modified array
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Function} condition Query condition, iterate and filter
     *      @arg {Object} each item
     *      @return {Boolean} Condition
     *   @property {Function} handle Handling function that modifies each item in the dataset
     *      @arg {Object} Reference to each item in the dataset
     * */
    update({ tableName, condition, handle }) {
        let res = [];
        return this.commitDb(tableName, (transaction) => transaction.openCursor(), 'readwrite', (e, resolve) => {
            this.cursor_success(e, {
                condition,
                handler: ({ currentValue, cursor }) => {
                    const value = handle(currentValue);
                    res.push(value);
                    cursor.update(value);
                },
                success: () => {
                    resolve(res);
                }
            });
        });
    }
    /**
     * @method Modify a specific item by primary key value and return the modified object
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {String\|Number} value Primary key value of the item to modify
     *   @property {Function} handle Handling function that modifies the item
     *      @arg {Object} Reference to the item to modify
     * */
    update_by_primaryKey({ tableName, value, handle }) {
        return this.commitDb(tableName, (transaction) => transaction.get(value), 'readwrite', (e, resolve, store) => {
            const currentValue = e.target.result;
            if (!currentValue) {
                resolve(null);
                return;
            }
            const value = handle(currentValue);
            store.put(value);
            resolve(value);
        });
    }
    //=================relate insert================================
    /**
     * @method Add data to a table
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Object} data Data to insert
     * */
    insert({ tableName, data }) {
        return this.commitDb(tableName, undefined, 'readwrite', (_, resolve, store) => {
            data instanceof Array ? data.forEach(v => store.put(v)) : store.put(data);
            resolve();
        });
    }
    //=================relate delete================================
    /**
     * @method Delete data and return the deleted array
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Function} condition Query condition, iterate and filter
     *      @arg {Object} each item
     *      @return {Boolean} Condition
     * */
    delete({ tableName, condition }) {
        let res = [];
        return this.commitDb(tableName, (transaction) => transaction.openCursor(), 'readwrite', (e, resolve) => {
            this.cursor_success(e, {
                condition,
                handler: ({ currentValue, cursor }) => {
                    res.push(currentValue);
                    cursor.delete();
                },
                success: () => {
                    resolve(res);
                }
            });
        });
    }
    /**
     * @method Delete data by primary key value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {String\|Number} value Primary key value of the item to delete
     * */
    delete_by_primaryKey({ tableName, value }) {
        return this.commitDb(tableName, (transaction) => transaction.delete(value), 'readwrite', (e, resolve) => {
            resolve();
        });
    }
    //=================relate db================================
    /**
     * @method Open the database
     */
    open_db() {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.version);
            request.onerror = e => {
                reject(e);
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                let task;
                while (task = this.queue.pop()) {
                    task();
                }
                resolve(this);
            };
            //Database upgrade
            request.onupgradeneeded = e => {
                this.tableList.forEach((element) => {
                    this.create_table(e.target.result, element);
                });
            };
        });
    }
    /**
     * @method Close the database
     * @param {String} db Database name
     */
    close_db() {
        return new Promise((resolve, reject) => {
            try {
                if (!this.db) {
                    resolve('Please open the database');
                    return;
                }
                this.db.close();
                this.db = null;
                TsIndexDb._instance = null;
                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * @method Delete a database
     * @param {String} name Database name
     */
    delete_db(name) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(name);
            request.onerror = e => {
                reject(e);
            };
            request.onsuccess = e => {
                resolve(e);
            };
        });
    }
    /**
     * @method Delete all data from a table
     * @param {String} name Database name
     */
    delete_table(tableName) {
        return this.commitDb(tableName, (transaction) => transaction.clear(), 'readwrite', (_, resolve) => {
            resolve();
        });
    }
    /**
     * Create a table
     * @option<Object> keyPath specifies the primary key and autoIncrement indicates whether to auto-increment the primary key
     * @index Index configuration
     */
    create_table(idb, { tableName, option, indexs = [] }) {
        if (!idb.objectStoreNames.contains(tableName)) {
            let store = idb.createObjectStore(tableName, option);
            for (let { key, option } of indexs) {
                store.createIndex(key, key, option);
            }
        }
    }
    /**
     * Submit a DB request
     * @param {String} tableName Table name
     * @param {Function} commit Function to commit data
     * @param {String} mode Transaction mode
     * @param {Function} backF Cursor method
     */
    commitDb(tableName, commit, mode = 'readwrite', backF) {
        return new Promise((resolve, reject) => {
            const task = () => {
                try {
                    if (this.db) {
                        let store = this.db.transaction(tableName, mode).objectStore(tableName);
                        if (!commit) {
                            backF(null, resolve, store);
                            return;
                        }
                        let res = commit(store);
                        res.onsuccess = (e) => {
                            if (backF) {
                                backF(e, resolve, store);
                            }
                            else {
                                resolve(e);
                            }
                        };
                        res.onerror = (event) => {
                            reject(event);
                        };
                    }
                    else {
                        reject(new Error('Please open the database'));
                    }
                }
                catch (error) {
                    reject(error);
                }
            };
            if (!this.db) {
                this.queue.push(task);
            }
            else {
                task();
            }
        });
    }
    /**
     * @method Cursor opened successfully, iterate over cursor
     * @param {Function} condition A function that specifies the condition to match each item against
     * @param {Function} handle A function to handle each item that matches the condition. @arg {Object} @property cursor: the cursor object, @property currentValue: the current item value
     * @param {Function} done A function to execute when the cursor has finished iterating
     * @return {Null}
     */
    cursor_success(e, { condition, handler, success }) {
        const cursor = e.target.result;
        if (cursor) {
            const currentValue = cursor.value;
            if (condition(currentValue))
                handler({ cursor, currentValue });
            cursor.continue();
        }
        else {
            success();
        }
    }
}
exports.TsIndexDb = TsIndexDb;
TsIndexDb._instance = null;
