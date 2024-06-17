import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as glob from '@actions/glob';
import fs from 'fs';

/**
 * 克隆仓库
 */
export const cloneRepo = async (): Promise<void> => {
  core.startGroup('clone repo');
  try {
    // todo: 传入分支
    // todo: 传入仓库地址
    // todo: 传入工作目录
    // todo: 传入 options 参数
    const exitcode = await exec(
      'git',
      ['clone', '--depth=1', '--single-branch', '--branch', 'develop', 'https://github.com/Tencent/tdesign-starter-cli', 'tdesign-starter-cli'],
    );

    if (exitcode !== 0) {
      core.setFailed('clone repo failed');
    }
    core.info(`clone repo success`);
    process.chdir('./tdesign-starter-cli');
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
  core.endGroup();
};

/**
 * 安装pnpm
 */
export const pnpmInstall = async (): Promise<void> => {
  core.startGroup('install pnpm');
  try {
    const exitcode = await exec('npm install pnpm -g');

    if (exitcode !== 0) {
      core.setFailed('pnpm install failed');
    }
    core.info(`install pnpm success`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
  core.endGroup();
};

/**
 * 构建项目
 */
export const buildProducts = async (): Promise<void> => {
  core.startGroup('build dist');
  try {
    const pnpmInstallExitcode = await exec('pnpm install');
    const exitcode = await exec('pnpm run build');

    if (exitcode !== 0 || pnpmInstallExitcode !== 0) {
      core.setFailed('build failed');
    }
    core.info(`build success`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
  core.endGroup();
};

/**
 * 生成vite模版
 */
export const generateViteTemplate = async (): Promise<void> => {
  //todo 兼容vite farm webpack
  core.startGroup('generate vite template');
  try {
    await exec('pnpm run dev init template-vite-vue2 --description 这是一个vite构建的vue2项目 --type vue2 --template lite --buildToolType vite');
    await exec('pnpm run dev init template-vite-vue3 --description 这是一个vite构建的vue3项目 --type vue3 --template lite --buildToolType vite');
    await exec('pnpm run dev init template-vite-react --description 这是一个vite构建的react项目 --type react --template lite --buildToolType vite');
    core.info('vite模版生成成功');

    const viteFilePath = await glob.create('template-vite-*/vite.config.*')
    const files = await viteFilePath.glob()
    core.info(`files ${files}`);
    files.map(async (file) => {
      const templateName = file.match(/template-vite-(.*)\//)

      core.info(JSON.stringify(templateName));
      
      const viteConfigFile = fs.readFileSync(file, 'utf-8');
      const newViteConfig = viteConfigFile.replace('defineConfig({', `defineConfig({\n base: ${templateName?.[0]},`)
      fs.writeFileSync(file, newViteConfig);

      //   exec(`cd ${templateName[0]} && pnpm install && pnpm run build`);
      //   // 重命名文件夹使用nodejs
      //   fs.renameSync(`${file}/dist`, `${currentDir}/dist/${templateName[0]}`);
    })


  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
  core.endGroup();
};