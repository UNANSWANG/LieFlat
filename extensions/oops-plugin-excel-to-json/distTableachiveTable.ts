
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TableachiveTable {
    static TableName: string = "achiveTable";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableachiveTable.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 类型（需要与成就对应） */
    get type(): number {
        return this.data.type;
    }
    /** 成就名 */
    get name(): string {
        return this.data.name;
    }
    /** 条件 */
    get conditions(): number {
        return this.data.conditions;
    }
    /** 奖励（0：体力、1：提示、2：辅助线） */
    get rewards(): string {
        return this.data.rewards;
    }
}
    