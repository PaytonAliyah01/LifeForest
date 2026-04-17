package com.lifeforest.backend.user.controller;

import com.lifeforest.backend.user.dto.request.UserCreateRequestDto;
import com.lifeforest.backend.user.dto.request.UserUpdateRequestDto;
import com.lifeforest.backend.user.dto.response.UserResponseDto;
import com.lifeforest.backend.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDto createUser(@Valid @RequestBody UserCreateRequestDto dto){
        return userService.register(dto);
    }

    @PutMapping("/{id}")
    public UserResponseDto updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequestDto dto){
        return userService.update(id, dto);
    }

    @GetMapping("/{id}")
    public UserResponseDto getUserById(@PathVariable Long id) {
    return userService.getById(id);
    }
}
