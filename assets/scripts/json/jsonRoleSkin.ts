import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonRoleSkin')
export class jsonRoleSkin extends jsonBase {
    /** 表格名称 */
    tableName: string = "roleSkin";
    protected jsonPath: string = "json/roleSkin";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    /**获取角色皮肤数据 */
    get roleSkinAllData() : JsonRoleSkinData[]{
        return this.data;
    }

    /**获取指定等级角色皮肤数据 */
    getRoleSkinData(level: number): JsonRoleSkinData {
        if (!this.data) {
            return null;
        }

        if(level >= this.data.length){
            level = this.data.length - 1;
        }
        return this.data[level];
    }
}
export let roleSkinConfig = new jsonRoleSkin();

interface JsonRoleSkinData {
    /**角色id */
    roleId: number;
    /**名称 */
    name: string;
    /**是否为初始皮肤 */
    isDefault: number;
    /**获取条件 */
    limitType: number;
    /**购买所需金币（类型1） */
    money: number;
    /**通关次数（类型3） */
    levelNum: number;
}


