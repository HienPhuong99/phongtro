// Cho phép import mã nghiệp vụ dùng chung với bản web (../src: types, dữ liệu mẫu, tính tiền)
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../src')];

module.exports = config;
