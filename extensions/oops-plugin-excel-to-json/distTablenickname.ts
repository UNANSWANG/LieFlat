
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class Tablenickname {
    static TableName: string = "nickname";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(Tablenickname.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 昵称 */
    get nickname(): string {
        return this.data.nickname;
    }
}
    