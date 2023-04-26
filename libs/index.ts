/*
 * @Description: file content
 * @Author: andi
 * @Date: 2023-03-11 21:24:32
 * @LastEditors: andi
 * @LastEditTime: 2023-03-11 09:13:06
 */

import { TsIndexDb, IIndexDb } from "./TsIndexDb";

import { DbOperate, DbCountOperate } from "./TsIndexDb";

// /**
//  * @method The initialization function
//  * @param param0
//  * @param isMany
//  */
// export const initMany = (dbList: IIndexDb[]): Promise<TsIndexDb> => {
//     const db = TsIndexDb.getInstance({
//         dbName,
//         version,
//         tables
//     })
//     return db.open_db()
// }
/**
 * @method The initialization function
 * @param param0
 * @param isMany
 */
export const init = ({
  dbName,
  version = 1,
  tables = [],
}: IIndexDb): Promise<TsIndexDb> => {
  const db = TsIndexDb.getInstance({
    dbName,
    version,
    tables,
  });
  return db.open_db();
};

/**
 * @method To get the singleton object
 */
export const getInstance = () => TsIndexDb.getInstance();

export { DbOperate, TsIndexDb, IIndexDb, DbCountOperate };
