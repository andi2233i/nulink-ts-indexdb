export declare type IIndexDb = {
    dbName: string;
    version: number;
    tables: DbTable[];
};
export declare type DbIndex = {
    key: string;
    option?: IDBIndexParameters;
};
export declare type DbTable = {
    tableName: string;
    option?: IDBObjectStoreParameters;
    indexs: DbIndex[];
};
export declare type AtleastOne<T, U = {
    [K in keyof T]: Pick<T, K>;
}> = Partial<T> & U[keyof U];
export interface DbOperate<T> {
    tableName: string;
    key: string;
    data: T | T[];
    value: string | number;
    countCondition: {
        type: 'equal' | 'gt' | 'lt' | 'between';
        rangeValue: [any, any?, any?, any?];
    };
    condition(data: T): boolean;
    success(res: T[] | T): void;
    handle(res: T): void;
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
export declare class TsIndexDb {
    private dbName;
    private version;
    private tableList;
    private db;
    private queue;
    constructor({ dbName, version, tables }: IIndexDb);
    private static _instance;
    static getInstance(dbOptions?: IIndexDb): TsIndexDb;
    /**
     * @method Query all data from a table (returning an array of specific values)
     * @param {Object}
     *   @property {String} tableName table name
     */
    queryAll<T>({ tableName }: Pick<DbOperate<T>, 'tableName'>): Promise<T[]>;
    /**
     * @method Query (returning an array of specific values)
     * @param {Object}
     *   @property {String} tableName table name
     *   @property {Function} condition Query criteria
     * */
    query<T>({ tableName, condition }: Pick<DbOperate<T>, 'condition' | 'tableName'>): Promise<T[]>;
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
    count<T>({ tableName, key, countCondition }: Pick<DbCountOperate<T>, 'key' | 'tableName' | 'countCondition'>): Promise<T>;
    /**
     * @method Query data based on specific table properties and return a specific value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} key Name of the field to search
     *   @property {Number|String} value Value of the field to search
     * */
    query_by_keyValue<T>({ tableName, key, value }: Pick<DbOperate<T>, 'tableName' | 'key' | 'value'>): Promise<T>;
    /**
     * @method Query data by primary key value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Number|String} value Primary key value
     * */
    query_by_primaryKey<T>({ tableName, value }: Pick<DbOperate<T>, 'tableName' | 'value'>): Promise<T>;
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
    update<T>({ tableName, condition, handle }: Pick<DbOperate<T>, 'tableName' | 'condition' | 'handle'>): Promise<T>;
    /**
     * @method Modify a specific item by primary key value and return the modified object
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {String\|Number} value Primary key value of the item to modify
     *   @property {Function} handle Handling function that modifies the item
     *      @arg {Object} Reference to the item to modify
     * */
    update_by_primaryKey<T>({ tableName, value, handle }: Pick<DbOperate<T>, 'tableName' | 'value' | 'handle'>): Promise<T>;
    /**
     * @method Add data to a table
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Object} data Data to insert
     * */
    insert<T>({ tableName, data }: Pick<DbOperate<T>, 'tableName' | 'data'>): Promise<T>;
    /**
     * @method Delete data and return the deleted array
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {Function} condition Query condition, iterate and filter
     *      @arg {Object} each item
     *      @return {Boolean} Condition
     * */
    delete<T>({ tableName, condition }: Pick<DbOperate<T>, 'tableName' | 'condition'>): Promise<T>;
    /**
     * @method Delete data by primary key value
     * @param {Object}
     *   @property {String} tableName Table name
     *   @property {String\|Number} value Primary key value of the item to delete
     * */
    delete_by_primaryKey<T>({ tableName, value }: Pick<DbOperate<T>, 'tableName' | 'value'>): Promise<T>;
    /**
     * @method Open the database
     */
    open_db(): Promise<TsIndexDb>;
    /**
     * @method Close the database
     * @param {String} db Database name
     */
    close_db(): Promise<unknown>;
    /**
     * @method Delete a database
     * @param {String} name Database name
     */
    delete_db(name: string): Promise<unknown>;
    /**
     * @method Delete all data from a table
     * @param {String} name Database name
     */
    delete_table(tableName: string): Promise<unknown>;
    /**
     * Create a table
     * @option<Object> keyPath specifies the primary key and autoIncrement indicates whether to auto-increment the primary key
     * @index Index configuration
     */
    private create_table;
    /**
     * Submit a DB request
     * @param {String} tableName Table name
     * @param {Function} commit Function to commit data
     * @param {String} mode Transaction mode
     * @param {Function} backF Cursor method
     */
    private commitDb;
    /**
     * @method Cursor opened successfully, iterate over cursor
     * @param {Function} condition A function that specifies the condition to match each item against
     * @param {Function} handle A function to handle each item that matches the condition. @arg {Object} @property cursor: the cursor object, @property currentValue: the current item value
     * @param {Function} done A function to execute when the cursor has finished iterating
     * @return {Null}
     */
    cursor_success(e: any, { condition, handler, success }: any): void;
}
