import { ccResTools } from "../extention/resTools";
import { ccStorageTools } from "../extention/storageTools";
import { GameEvent, gmConfig, SaveKey } from "../manager/configData";
import { gm } from "../manager/gm";
import { uiMgr } from "../manager/UIManager";

export class jsonBase {
    /** 表格名称 */
    tableName: string = "";
    /** 表格路径 */
    protected jsonPath: string = "";
    /**表格链接1 */
    protected tableUrl1: string = "";
    /**表格链接2 */
    protected tableUrl2: string = "";
    /** 表格数据 */
    protected data: any;
    /**是否派发过表格加载完成事件 */
    protected isTableLoadComplete = false;

    async initTable() {
        //登录回调检测表格提前加载完成
        gm.Event.on(GameEvent.checkLoginLoad, this.checkAdvanceComplete, this);
        if (!gmConfig.useJsonLocal && this.tableUrl1) {
            //线上表格
            let tempData = await ccResTools.loadJsonByUrl(this.tableUrl1);
            //还需要转化成数组
            this.data = tempData;
            if (!this.tableUrl2) {
                //没有表格2直接加载完成
                this.tableLoadComplete();
            } else {
                if (this.tableUrl2) {
                    //检查是否提前回调
                    this.checkAdvanceComplete();
                    //线上表格2
                    let tempData2 : any = await ccResTools.loadJsonByUrl(this.tableUrl2);
                    //合并表格2数据
                    this.data = [...this.data, ...tempData2];
                    this.tableLoadComplete();
                }
            }
        } else {
            //本地表格
            let tempData = await ccResTools.loadJson(uiMgr.resBundle, this.jsonPath);
            //还需要转化成数组
            this.data = Object.values(tempData);
            this.tableLoadComplete();
        }
        if(gm.isDebug){
            console.warn(this.tableName, 'JSON 数据:', this.data);
        }
    }

    /**
     * 表格处理。
     * 在线表格会把数值字段下发为字符串，这里统一将所有数据转换为运行时类型：
     * 数字优先，其次布尔值；其余数据保持 JSON 原始值。
     */
    protected processTableData() {
        this.data = this.normalizeTableValue(this.data);
    }

    /**
     * 递归转换表格值。数组和对象保留原有结构，内部值遵循相同转换规则。
     *
     * 转换优先级：number > boolean，其他值不处理。
     */
    private normalizeTableValue(value: any): any {
        if (Array.isArray(value)) {
            return value.map(item => this.normalizeTableValue(item));
        }

        if (value && typeof value == "object") {
            let normalizedData: Record<string, any> = {};
            for (let key in value) {
                normalizedData[key] = this.normalizeTableValue(value[key]);
            }
            return normalizedData;
        }

        if (typeof value == "number") {
            return value;
        }

        if (typeof value == "boolean") {
            return value;
        }

        if (typeof value == "string") {
            let trimmedValue = value.trim();
            if (trimmedValue) {
                let numberValue = Number(trimmedValue);
                if (Number.isFinite(numberValue)) {
                    return numberValue;
                }

                let lowerCaseValue = trimmedValue.toLowerCase();
                if (lowerCaseValue == "true") {
                    return true;
                }
                if (lowerCaseValue == "false") {
                    return false;
                }
            }
            return value;
        }

        return value;
    }

    /**检测表格是否提前回调（适用于有2表的） */
    protected checkAdvanceComplete() {
        //已经登录，且表格1已经有数据，才需要检查
        if (gm.isLogin && this.data) {
            if (this.tableName == "levelTable") {
                //已登录，通过关卡判断是否需要直接结束加载
                let maxLevel = ccStorageTools.getNumberData(SaveKey.level) || 0;
                //第一张关卡表有30关，快到30关的时候，需要等待2表加载完成
                if (maxLevel < 25) {
                    this.tableLoadComplete();
                }
            }
        }
    }

    /**表格加载结束回调 */
    protected tableLoadComplete() {
        this.processTableData();
        if (!this.isTableLoadComplete) {
            this.isTableLoadComplete = true;
            gm.Event.emit(GameEvent.loadTable, this.tableName);
        }
    }

    /** 编号【KEY】 */
    id: number = 0;
}


