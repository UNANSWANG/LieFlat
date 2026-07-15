import { _decorator, AssetManager, assetManager, Component, ImageAsset, JsonAsset, Node, Prefab, sp, SpriteFrame, Texture2D, TiledMapAsset } from 'cc';
import { gm, PlatType } from '../manager/gm';
import { GameEvent } from '../manager/configData';
const { ccclass, property } = _decorator;

@ccclass('resTools')
export class resTools {
    picMap: Map<string, SpriteFrame> = new Map();
    spineMap: Map<string, sp.SkeletonData> = new Map();
    //加载bundle
    loadBundle($name): Promise<AssetManager.Bundle> {
        return new Promise(($resolve) => {
            assetManager.loadBundle($name, (err, res: AssetManager.Bundle) => {
                console.log("加载bundle完成:", $name);
                $resolve(res);
            })
        });
    }
    //通过budle加载资源，此处以json资源为例
    loadJsonByUrl(url): Promise<JSON> {
        return new Promise((resolve: (value) => void, reject: (error?: Error) => void) => {
            if (gm.platType == PlatType.h5) {
                try {
                    fetch(url).then((response) => {
                        if (!response.ok) {

                            throw new Error(`HTTP ${response.status}`);
                        }

                        resolve(response.json());
                    });

                } catch (e) {

                    console.error("加载json失败:", e);

                    reject(e);
                }
            } else {
                try {
                    assetManager.loadRemote(url, { ext: '.json' }, (err, myJson: any) => {
                        if (err) {
                            console.log("加载远程json失败:", err);
                            reject(err);
                        }
                        // console.log("NET_JSON=======>,", myJson.json);
                        resolve(myJson.json);
                    })
                } catch (err) {
                    console.log("加载远程json失败catch:", err);
                    reject(err);
                }
            }
        });
    }
    /**加载网络图片 */
    loadPicByUrl($url: string): Promise<SpriteFrame> {
        return new Promise(($resolve) => {
            if (this.picMap.has($url)) {
                $resolve(this.picMap.get($url));
                return;
            }
            assetManager.loadRemote($url, { ext: `.jpg` },
                (err, res: ImageAsset) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    let $img = res instanceof ImageAsset ? res : new ImageAsset(res);
                    let $tex = new Texture2D();
                    let $spriteFrame = new SpriteFrame();
                    $tex.image = $img;
                    $spriteFrame.texture = $tex;
                    this.picMap.set($url, $spriteFrame);
                    $resolve($spriteFrame);
                });
        })
    }

    /**加载预制体*/
    loadPrefab($bundle: AssetManager.Bundle, $path: string, showLoading: boolean = true): Promise<Prefab> {
        return new Promise(($resolve) => {
            $bundle.load($path, Prefab,
                (finish: number, total: number) => {
                    if (showLoading) {
                        gm.Event.emit(GameEvent.loading, [finish, total, $path]);
                    }
                },
                (err, prefab: Prefab) => {
                    $resolve(prefab);
                })
        });
    }
    /**
     * 加载一张图片,
     * @param $bundle 
     * @param $path 资源路径
     * @param call 回调
     * @returns 
     */
    loadPic($bundle: AssetManager.Bundle, $path: string, call?): Promise<SpriteFrame> {
        return new Promise(($resolve) => {
            if (this.picMap.has($path)) {
                $resolve(this.picMap.get($path));
                return;
            }
            $bundle.load($path, SpriteFrame, (err, res: SpriteFrame) => {
                call && call(res);
                this.picMap.set($path, res);
                $resolve(res);
            });
        });
    }

    /**加载spine数据 */
    loadSpine($bundle: AssetManager.Bundle, $path: string): Promise<sp.SkeletonData> {
        return new Promise(($resolve) => {
            if (this.spineMap.has($path)) {
                $resolve(this.spineMap.get($path));
                return;
            }

            $bundle.load($path, sp.SkeletonData, (err, res: sp.SkeletonData) => {
                if (err) {
                    console.log("加载spine失败", $path, err);
                    $resolve(null);
                    return;
                }

                this.spineMap.set($path, res);
                $resolve(res);
            });
        });
    }

    loadJson($bundle: AssetManager.Bundle, $path: string): Promise<any> {
        return new Promise(($resolve) => {
            $bundle.load($path, JsonAsset, (err, jsonAsset: JsonAsset) => {

                // 获取 JSON 数据
                const jsonData = jsonAsset.json;
                // console.warn($path,'JSON 数据:', jsonData);

                $resolve(jsonData);
            });
        });
    }

    /**加载瓦片地图 */
    loadTiledMap($bundle: AssetManager.Bundle, $path: string, showLoading: boolean = true): Promise<TiledMapAsset> {
        return new Promise(($resolve) => {
            $bundle.load($path, TiledMapAsset,
                (finish: number, total: number) => {
                    if (showLoading) {
                        gm.Event.emit(GameEvent.loading, [finish, total, $path]);
                    }
                },
                (err, tiledMapAsset: TiledMapAsset) => {
                    if (err) {
                        console.error("加载瓦片地图失败", $path, err);
                        $resolve(null);
                        return;
                    }

                    $resolve(tiledMapAsset);
                });
        });
    }
}
export let ccResTools = new resTools();


