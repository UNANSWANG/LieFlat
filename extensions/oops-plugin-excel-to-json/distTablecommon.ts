
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class Tablecommon {
    static TableName: string = "common";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(Tablecommon.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 键 */
    get key(): string {
        return this.data.key;
    }
    /** 值 */
    get value(): string {
        return this.data.value;
    }
}
    