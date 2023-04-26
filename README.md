<!--
 * @Description: file content
 * @Author: andi
 * @Date: 2023-03-11 20:48:03
 * @LastEditors: andi
 * @LastEditTime: 2023-03-11 17:59:43
 -->
# nulink-ts-indexdb 
[![Build Status](https://github.com/andi2233i/nulink-ts-indexdb)](https://github.com/andi2233i/nulink-ts-indexdb)
## Install

```sh
npm install @nulink_network/ts-indexdb
yarn add @nulink_network/ts-indexdb
```
## Usage
### Typescript
```
import { init, getInstance } from 'ts-indexdb';
export type Rack =  {
    name: string
    id?: number
}
```

### javascript

```
import TsIndexDb = require('ts-indexdb');
```
## Methods of Database Operations
### Note:
* This class is a singleton pattern, so it only needs to be initialized once with init(), and then you can use getInstance() to get the instance for database operations.
* All the operations return Promises.
* Generics are not needed in JavaScript.
### Database and Table Operations
| Method | Method Name | Parameter | Attribute |
| --- | --- | --- | --- |
| open_db | Open Database | None | - |
| close_db | Close Database | None | - |
| delete_db | Delete Database | String | name |
| delete_table | Delete Table Data | String | tableName |




### Query Operations

| Method | Method Name | Parameter | Attribute |
| --- | --- | --- | --- |
| queryAll | Query all data of a table (return as an array) | Object | { tableName } |
| query | Query data (return as an array) | Object | { tableName, condition } |
| query_by_keyValue | Query data by specific table property (return as a specific item) | Object | { tableName, key, value } |
| query_by_primaryKey | Query data by primary key value | Object | { tableName, value } |
| count | Count data by primary key value | Object | { tableName, key, countCondition:{type,rangeValue } } |


### Update Operations

| Method | Method Name | Parameter | Attribute |
| --- | --- | --- | --- |
| update | Update data based on a condition (return the modified data as an array) | Object | { tableName, condition, handle } |
| update_by_primaryKey | Update specific data by primary key value (return the modified data as an object) | Object | { tableName, value, handle } |

### Insert Operations

| Method | Method Name | Parameter | Attribute |
| --- | --- | --- | --- |
| insert | Insert data | Object | { tableName, data(array or single object) } |

### Delete Operations

| Method | Method Name | Parameter | Attribute |
| --- | --- | --- | --- |
| delete | Delete data based on a condition (return the deleted data as an array) | Object | { tableName, condition } |
| delete_by_primaryKey | Delete data by primary key value | Object | { tableName, value } |




## Example:

### Initialization


```swift
await init({
    dbName: "books",        // database name               
    version: 1,             // version number                
    tables: [                               
        {
            tableName: "bookrackList",         // table name         
            option: { keyPath: "id", autoIncrement: true }, // specify the primary key as "id"
            indexs: [    // database indexes
                {
                    key: "id",
                    option: {
                        unique: true
                    }
                },
                {
                    key: "name"
                }
            ]
        }
    ]
})
```

### Query

```vbnet
/**
    * @method Query all data of a table (return as an array)
    * @param {Object}
    *   @property {String} tableName table name
    */
  await getInstance().queryAll<Rack>({
    tableName: 'bookrackList'
  });


  /**
    * @method Query data (return as an array)
    * @param {Object}
    *   @property {String} tableName table name
    *   @property {Function} condition query condition
    * */
  await getInstance().query<Rack>({
     tableName: 'bookrackList',
     condition: item => item.id === 3
   });

  /**
    * @method Query data by specific table property (return as a specific item)
    * @param {Object}
    *   @property {String} tableName table name
    *   @property {Number|String} key property name
    *   @property {Number|String} value property value
    *
    * */
  await getInstance().query_by_keyValue<Rack>({
     tableName: 'bookrackList',
     key: 'name',
     value: 'My senior fellow apprentice is really steady'
   });

  /**
    * @method Query data by primary key value
    * @param {Object}
    *   @property {String} tableName table name
    *   @property {Number|String} value primary key value
    *
    * */ 
  await getInstance().query_by_primaryKey<Rack>({
     tableName: 'bookrackList',
     value: 3
   });

  /**
     * @method Count data by primary key value
     * @param {Object}
     *   @property {String} tableName table name
     *   @property {Number|String} key query key
     *   @property {Object} countCondition query condition
   * */
  /** Count condition input method:
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
  await getInstance().count<Rack>({
    tableName: 'bookrackList',
    key: 'createdTime',
    countCondition: {
      type: 'between',
      rangeValue:[1676627113088,new Date().getTime()]
    }
  })
```

### Update


```vbnet
/**
     * @method Update data based on a condition (return the modified data as an array)
     * @param {Object}
     *   @property {String} tableName table name
     *   @property {Function} condition query condition, traverse, similar to filter
     *      @arg {Object} each element
     *      @return condition
     *   @property {Function} handle processing function, receiving a reference to this data, and modifying it
     * */
  await getInstance().update<Rack>({
        tableName: 'bookrackList',
        condition: item => item.id === 8,
        handle: r => {
          r.name = 'test modification';
          return r;
        }
  })


  /**
  * @method Update specific data by primary key value (return the modified data as an object)
  * @param {Object}
  *   @property {String} tableName table name
  *   @property {String|Number} value target primary key value
  *   @property {Function} handle processing function, receiving a reference to this data, and modifying it
  * */
  await getInstance().update_by_primaryKey<Rack>({
        tableName: 'bookrackList',
        value: 1,
        handle: r => {
          r.name = 'test modification';
          return r;
        }
  })
```
### Insert


```vbnet
/**
     * @method Insert data
     * @param {Object}
     *   @property {String} tableName table name
     *   @property {Object} data inserted data
     * */
  await getInstance().insert<Rack>({
    tableName: 'bookrackList',
    data: {
      name: 'test',
    }
  })
```
### Delete


```vbnet
/**
  * @method Delete data based on a condition (return the deleted data as an array)
  * @param {Object}
  *   @property {String} tableName table name
  *   @property {Function} condition query condition, traverse, similar to filter
  *      @arg {Object} each element
  *      @return condition
  * */
await getInstance().delete<Rack>({
  tableName: 'bookrackList',
  condition: (item)=> item.name === 'test',
})


 /**
  * @method Delete data by primary key value
  * @param {Object}
  *   @property {String} tableName table name
  *   @property {String|Number} value target primary key value
  * */
await getInstance().delete_by_primaryKey<Rack>({
  tableName: 'bookrackList',
  value: 4
})

/**
  * @method Delete all data of a table
  * @param {String}name database name
  */
await getInstance().delete_table('bookrackList')


/**
  * @method Delete a database
  * @param {String}name database name
  */
await getInstance().delete_db('bookrackList')
```

