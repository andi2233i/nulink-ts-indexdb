"use strict";
/*
 * @Description: file content
 * @Author: andi
 * @Date: 2023-03-11 21:24:32
 * @LastEditors: andi
 * @LastEditTime: 2023-03-11 09:13:06
 */
Object.defineProperty(exports, "__esModule", { value: true });
const TsIndexDb_1 = require("./TsIndexDb");
exports.TsIndexDb = TsIndexDb_1.TsIndexDb;
// /**
//  * @method 初始化函数
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
 * @method 初始化函数
 * @param param0
 * @param isMany
 */
exports.init = ({ dbName, version = 1, tables = [], }) => {
    const db = TsIndexDb_1.TsIndexDb.getInstance({
        dbName,
        version,
        tables,
    });
    return db.open_db();
};
/**
 * @method 获取单例的单个对象
 */
exports.getInstance = () => TsIndexDb_1.TsIndexDb.getInstance();
