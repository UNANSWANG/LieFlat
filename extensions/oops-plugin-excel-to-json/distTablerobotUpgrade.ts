
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablerobotUpgrade {
    static TableName: string = "robotUpgrade";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablerobotUpgrade.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 道具类型 */
    get propsType(): string {
        return this.data.propsType;
    }
    /** 时间下限 */
    get timeMin(): number {
        return this.data.timeMin;
    }
    /** 时间上限 */
    get timeMax(): number {
        return this.data.timeMax;
    }
}
    