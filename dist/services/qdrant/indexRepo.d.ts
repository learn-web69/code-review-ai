interface FileWithContent {
    filePath: string;
    content: string;
}
/**
 * Index provided files into Qdrant.
 * `files` is an array: [{ filePath, content }]
 */
export declare function indexRepo(files: FileWithContent[]): Promise<number>;
export {};
//# sourceMappingURL=indexRepo.d.ts.map