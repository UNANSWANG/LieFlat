
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TableroleSkin {
    static TableName: string = "roleSkin";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableroleSkin.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 角色id */
    get roleId(): number {
        return this.data.roleId;
    }
    /** 名称 */
    get name(): string {
        return this.data.name;
    }
    /** 是否为初始皮肤 */
    get isDefault(): number {
        return this.data.isDefault;
    }
    /** 获取条件 */
    get limitType(): number {
        return this.data.limitType;
    }
    /** 购买所需金币
（类型1） */
    get money(): number {
        return this.data.money;
    }
    /** 通关次数
（类型3） */
    get levelNum(): number {
        return this.data.levelNum;
    }
}
    