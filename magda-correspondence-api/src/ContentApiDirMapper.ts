import buildJwt from "@magda/typescript-common/dist/session/buildJwt";
import * as rp from "request-promise-native";
import * as mime from "mime-types";
import * as recursiveReadDir from "recursive-readdir";
import * as fse from "fs-extra";
import * as path from "path";
import * as typeis from "type-is";

class ContentApiDirMapper {
    public url: string;
    public userId: string;
    private jwtSecret: string;

    constructor(url: string, userId: string = "", jwtSecret: string = "") {
        this.url = url;
        this.userId = userId;
        this.jwtSecret = jwtSecret;
        if (this.url === "") {
            throw new Error(
                "ContentApiDirMapper: content API URL canot be empty!"
            );
        }
    }

    public async getFileContent(localPath: string) {
        const res = await rp.get(`${this.url}/${localPath}`, {
            resolveWithFullResponse: true,
            encoding: null
        });
        const contentType = res.headers["content-type"];
        if (typeis.is(contentType, ["text/*"])) {
            return res.body.toString("utf-8");
        }
        return res.body;
    }

    public async saveFile(localPath: string, fileContent: Buffer) {
        let mimeType = mime.lookup(localPath);
        if (mimeType === false) {
            mimeType = "application/octet-stream";
        }
        return await rp(`${this.url}/${localPath}`, {
            method: "POST",
            resolveWithFullResponse: true,
            headers: {
                "X-Magda-Session": buildJwt(this.jwtSecret, this.userId),
                "Content-type": mimeType
            },
            body: fileContent
        });
    }

    public async fileExist(localPath: string) {
        const res = await rp.head(`${this.url}/${localPath}`, {
            resolveWithFullResponse: true,
            simple: false
        });
        if (res.statusCode !== 200) return false;
        else return true;
    }

    public async syncFolder(
        localFolderPath: string,
        remoteFolerName: string = ""
    ) {
        const absLocalFolderPath = path.resolve(localFolderPath);
        let targetRemoteFolderName = remoteFolerName;
        if (remoteFolerName === "") {
            targetRemoteFolderName = path.basename(absLocalFolderPath);
        }
        const files = await recursiveReadDir(localFolderPath);
        if (!files || !files.length) {
            return [[], []];
        }
        const skippedFiles = [];
        for (let i = 0; i < files.length; i++) {
            const fileRemoteLocalPath = `${targetRemoteFolderName}${files[
                i
            ].replace(absLocalFolderPath, "")}`;
            const checkFile = await this.fileExist(fileRemoteLocalPath);
            if (checkFile) {
                skippedFiles.push(fileRemoteLocalPath);
                continue;
            }
            const fileContent = await fse.readFile(`${files[i]}`);
            await this.saveFile(fileRemoteLocalPath, fileContent);
        }
        return [files, skippedFiles];
    }
}

export default ContentApiDirMapper;
