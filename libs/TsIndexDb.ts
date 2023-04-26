/*
 * @Description: file content
 * @Author: andi
 * @Date: 2023-03-11 21:25:02
 * @LastEditors: andi
 * @LastEditTime: 2023-03-11 14:40:36
 */
export type IIndexDb = {
    dbName: string
    version: number
    tables: DbTable[]
}
export type DbIndex = { key: string, option?: IDBIndexParameters }
export type DbTable = {
    tableName: string,
    option?: IDBObjectStoreParameters
    indexs: DbIndex[]
}
export type AtleastOne<T, U = { [K in keyof T]:Pick<T,K> }> = Partial<T>&U[keyof U]
interface MapCondition {
    equal: (value:any)=>IDBKeyRange,
    gt: (lower: any, open?: boolean)=>IDBKeyRange,
    lt: (upper: any, open?: boolean)=>IDBKeyRange,
    between: (lower: any, upper: any, lowerOpen?: boolean, upperOpen?: boolean)=>IDBKeyRange,
}
export interface DbOperate<T> {
    tableName: string,
    key: string,
    data: T | T[],
    value: string | number,
    countCondition: {type: 'equal'|'gt'|'lt'|'between',rangeValue: [any,any?,any?,any?]},
    condition(data: T): boolean
    success(res: T[] | T): void
    handle(res: T): void

}

export interface DbCountOperate<T> {
    tableName: string;
    key: string;
    countCondition: {
        type: 'equal' | 'gt' | 'lt' | 'between';
        rangeValue: [any, any?, any?, any?];
    };
}
export interface DbCountOperate<T> {
    tableName: string;
    key: string;
    countCondition: {
        type: 'equal' | 'gt' | 'lt' | 'between';
        rangeValue: [any, any?, any?, any?];
    };
}

export class TsIndexDb {

    private dbName: string = '';//The database name 
    private version: number = 1;//The database version
    private tableList: DbTable[] = [];//Table List 
    private db: IDBDatabase | null = null;
    private queue: (() => void)[] = []; //Transaction queue, once instantiated, the database will automatically start up the next time the page is opened.
    constructor({ dbName, version, tables }: IIndexDb) {
        this.dbName = dbName;
        this.version = version;
        this.tableList = tables;
    }

    private static _instance: TsIndexDb | null = null;

    public static getInstance(dbOptions?: IIndexDb): TsIndexDb {
        if (TsIndexDb._instance === null && dbOptions) {
            TsIndexDb._instance = new TsIndexDb(dbOptions);
        }
        return TsIndexDb._instance!;
    }




    //=================relate select================================
    /**
     * @method Query all data from a table (returning an array of specific values)
     * @param {Object}
     *   @property {String} tableName table name
     */
    queryAll<T>({ tableName }: Pick<DbOperate<T>, 'tableName'>) {
        let res: T[] = [];
        return this.commitDb<T[]>(tableName, (transaction: IDBObjectStore) => transaction.openCursor(), 'readonly', (e: any, resolve: (data: T[]) => void) => {
            this.cursor_success(e, {
                condition: () => true,
                handler: ({ currentValue }: any) => res.push(currentValue),
                success: () => resolve(res)
            })
        })
    }

    /**
     * @method Query (returning an array of specific values)
     * @param {Object}
     *   @property {String} tableName table name
     *   @property {Function} condition Query criteria
     * */
    query<T>({ tableName, condition }: Pick<DbOperate<T>, 'condition' | 'tableName'>) {
        let res: T[] = [];
        return this.commitDb<T[]>(tableName, (transaction: IDBObjectStore) => transaction.openCursor(), 'readonly', (e: any, resolve: (data: T[]) => void) => {
            this.cursor_success(e, {
                condition,
                handler: ({ currentValue }: any) => res.push(currentValue),
                success: () => resolve(res)
            })
        })
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
    count<T>({ tableName, key, countCondition }: Pick<DbCountOperate<T>, 'key' | 'tableName' | 'countCondition'>) {
        const mapCondition: MapCondition = {
            equal: IDBKeyRange.only,
            gt: IDBKeyRange.lowerBound,
            lt: IDBKeyRange.upperBound,
            between: IDBKeyRange.bound,
        }
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.index(key).count(mapCondition[countCondition.type](...countCondition.rangeValue)), 'readonly', (e: any, resolve: (data: T) => void) => {
            resolve(e.target.result || null);
        })
    }

    /**
     * @method Query data based on specific table properties and return a specific value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} key Name of the field to search
     *   @property {Number|String} value Value of the field to search
     * */
    query_by_keyValue<T>({ tableName, key, value }: Pick<DbOperate<T>, 'tableName' | 'key' | 'value'>) {
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.index(key).get(value), 'readonly', (e: any, resolve: (data: T) => void) => {
            resolve(e.target.result || null);
        })
    }

    /**
     * @method Query data by primary key value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} value Primary key value
     * */
    query_by_primaryKey<T>({ tableName, value }: Pick<DbOperate<T>, 'tableName' | 'value'>) {
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.get(value), 'readonly', (e: any, resolve: (data: T) => void) => {
            resolve(e.target.result || null);
        })
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
    update<T>({ tableName, condition, handle }: Pick<DbOperate<T>, 'tableName' | 'condition' | 'handle'>) {
        let res: T[] = [];
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.openCursor(), 'readwrite', (e: any, resolve: (data: T[]) => void) => {
            this.cursor_success(e, {
                condition,
                handler: ({ currentValue, cursor }: any) => {
                    const value = handle(currentValue);
                    res.push(value as any);
                    cursor.update(value);
                },
                success: () => {
                    resolve(res);
                }
            })
        })
    }

    /**
     * @method Modify a specific item by primary key value and return the modified object
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {String\|Number} value Primary key value of the item to modify
     *   @property {Function} handle Handling function that modifies the item
     *      @arg {Object} Reference to the item to modify
     * */
    update_by_primaryKey<T>({ tableName, value, handle }: Pick<DbOperate<T>, 'tableName' | 'value' | 'handle'>) {
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.get(value), 'readwrite',
            (e: any, resolve: (data: T | null) => void, store: IDBObjectStore) => {
                const currentValue = e.target.result;
                if (!currentValue) {
                    resolve(null);
                    return
                }
                const value = handle(currentValue);
                store.put(value);
                resolve(value as any);
            });
    }

    //=================relate insert================================
    /**
     * @method Add data to a table
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Object} data Data to insert
     * */
    insert<T>({ tableName, data }: Pick<DbOperate<T>, 'tableName' | 'data'>) {
        return this.commitDb<T>(tableName, undefined, 'readwrite',
            (_: any, resolve: () => void, store: IDBObjectStore) => {
                data instanceof Array ? data.forEach(v => store.put(v)) : store.put(data);
                resolve();
            })

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
    delete<T>({ tableName, condition }: Pick<DbOperate<T>, 'tableName' | 'condition'>) {
        let res: T[] = [];
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.openCursor(), 'readwrite', (e: any, resolve: (data: T[]) => void) => {
            this.cursor_success(e, {
                condition,
                handler: ({ currentValue, cursor }: any) => {
                    res.push(currentValue);
                    cursor.delete();
                },
                success: () => {
                    resolve(res);
                }
            })
        })
    }


    /**
     * @method Delete data by primary key value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {String\|Number} value Primary key value of the item to delete
     * */
    delete_by_primaryKey<T>({ tableName, value }: Pick<DbOperate<T>, 'tableName' | 'value'>) {
        return this.commitDb<T>(tableName, (transaction: IDBObjectStore) => transaction.delete(value), 'readwrite', (e: any, resolve: () => void) => {
            resolve()
        })
    }

    //=================relate db================================


    /**
     * @method Open the database
     */
    open_db() {
        return new Promise<TsIndexDb>((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.version);
            request.onerror = e => {
                reject(e);
            };
            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                let task: () => void;

                while (task = this.queue.pop() as any) {
                    task();
                }

                resolve(this);
            };
            //Database upgrade
            request.onupgradeneeded = e => {
                this.tableList.forEach((element: DbTable) => {
                    this.create_table((e.target as any).result, element);
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
                    resolve('Please open the database')
                    return
                }
                this.db!.close();
                this.db = null
                TsIndexDb._instance = null;
                resolve(true)
            } catch (error) {
                reject(error)
            }
        })

    }
    /**
     * @method Delete a database
     * @param {String} name Database name
     */
    delete_db(name: string) {
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
    delete_table(tableName: string) {
        return this.commitDb(tableName, (transaction: IDBObjectStore) => transaction.clear(), 'readwrite',
            (_: any, resolve: () => void) => {
                resolve();
            })
    }

    /**
     * Create a table
     * @option<Object> keyPath specifies the primary key and autoIncrement indicates whether to auto-increment the primary key
     * @index Index configuration
     */
    private create_table(idb: any, { tableName, option, indexs = [] }: DbTable) {

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
    private commitDb<T>(tableName: string,
        commit?: (transaction: IDBObjectStore) => IDBRequest<any>,
        mode: IDBTransactionMode = 'readwrite',
        backF?: (request: any, resolve: any, store: IDBObjectStore) => void) {
        return new Promise<T>((resolve, reject) => {
            const task = () => {
                try {
                    if (this.db) {
                        let store = this.db.transaction(tableName, mode).objectStore(tableName);
                        if (!commit) {
                            backF!(null, resolve, store);
                            return;
                        }
                        let res = commit(store);
                        res!.onsuccess = (e: any) => {
                            if (backF) {
                                backF(e, resolve, store);
                            } else {
                                resolve(e);
                            }
                        };
                        res!.onerror = (event) => {
                            reject(event);
                        };

                    } else {
                        reject(new Error('Please open the database'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            if (!this.db) {
                this.queue.push(task);
            } else {
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
    cursor_success(e: any, { condition, handler, success }: any):void {
        const cursor: IDBCursorWithValue = e.target.result;
        if (cursor) {
            const currentValue = cursor.value;
            if (condition(currentValue)) handler({ cursor, currentValue });
            cursor.continue();
        } else {
            success();
        }
    }
}
