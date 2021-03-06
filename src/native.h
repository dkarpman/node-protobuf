#ifndef NATIVE_H
#define NATIVE_H

#include "common.h"

class NativeProtobuf : public Nan::ObjectWrap {
public:
  static void Init(Local<Object> exports);
  NativeProtobuf(DescriptorPool *pool, std::vector<std::string> info);

  DescriptorPool *pool;
  std::vector<std::string> info;
private:
  static NAN_METHOD(New);
  static NAN_METHOD(Parse);
  static NAN_METHOD(Serialize);
  static NAN_METHOD(Info);
} ;

#endif
