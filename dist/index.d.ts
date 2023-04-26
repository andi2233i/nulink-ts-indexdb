import { TsIndexDb, IIndexDb } from "./TsIndexDb";
import { DbOperate, DbCountOperate } from "./TsIndexDb";
/**
 * @method The initialization function
 * @param param0
 * @param isMany
 */
export declare const init: ({ dbName, version, tables, }: IIndexDb) => Promise<TsIndexDb>;
/**
 * @method To get the singleton object
 */
export declare const getInstance: () => TsIndexDb;
export { DbOperate, TsIndexDb, IIndexDb, DbCountOperate };
